use borsh::BorshDeserialize;
use mpl_core::instructions::{
    CreateCollectionV2Cpi, CreateCollectionV2InstructionArgs, CreateV2Cpi, CreateV2InstructionArgs,
};
use mpl_core::types::{Creator, DataState, Plugin, PluginAuthorityPair, Royalties, UpdateDelegate};
use mpl_token_metadata::accounts::Metadata;
use mpl_token_metadata::instructions::{BurnV1Cpi, BurnV1InstructionArgs};
use solana_program::program::invoke;
use solana_program::system_instruction;
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, msg, pubkey::Pubkey, system_program,
};

use crate::error::BglMigratorError;
use crate::instruction::accounts::{MigrateTokenMetadataAccounts, StartTokenMetadataAccounts};
use crate::instruction::BglMigratorInstruction;
use crate::state::{CREATOR_RETURN, OWNER_RETURN, PREFIX, PROGRAM_SIGNER, PROGRAM_SIGNER_BUMP};

pub fn process_instruction<'a>(
    _program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction: BglMigratorInstruction =
        BglMigratorInstruction::try_from_slice(instruction_data)?;
    match instruction {
        BglMigratorInstruction::StartTokenMetadata => {
            msg!("Instruction: StartTokenMetadata");
            start_token_metadata(accounts)
        }
        BglMigratorInstruction::MigrateTokenMetadata => {
            msg!("Instruction: MigrateTokenMetadata");
            migrate_token_metadata(accounts)
        }
    }
}

fn start_token_metadata<'a>(accounts: &'a [AccountInfo<'a>]) -> ProgramResult {
    // Accounts.
    let ctx = StartTokenMetadataAccounts::context(accounts)?;

    let authority = match ctx.accounts.authority {
        Some(authority) => {
            if !authority.is_signer {
                return Err(BglMigratorError::AuthorityMustSign.into());
            };
            authority
        }
        None => ctx.accounts.payer,
    };

    // Guards.
    if *ctx.accounts.system_program.key != system_program::ID {
        return Err(BglMigratorError::InvalidSystemProgram.into());
    }

    if *ctx.accounts.mpl_core.key != mpl_core::ID {
        return Err(BglMigratorError::InvalidMplCoreProgram.into());
    }

    if *ctx.accounts.tm_collection_metadata.owner != mpl_token_metadata::ID {
        return Err(BglMigratorError::InvalidOldCollectionAccountOwner.into());
    }

    let old_collection_metadata =
        Metadata::safe_deserialize(&ctx.accounts.tm_collection_metadata.data.borrow())?;

    let (new_collection_address, bump) = Pubkey::find_program_address(
        &[PREFIX.as_bytes(), &old_collection_metadata.mint.to_bytes()],
        &crate::ID,
    );
    if *ctx.accounts.core_collection.key != new_collection_address {
        return Err(BglMigratorError::InvalidNewCollectionAccount.into());
    }

    if old_collection_metadata.update_authority != *authority.key {
        return Err(BglMigratorError::UpdateAuthorityMustSign.into());
    }

    let (program_signer, program_signer_bump) =
        Pubkey::find_program_address(&[PREFIX.as_bytes()], &crate::ID);
    msg!("Program signer: {:?}", program_signer);
    msg!("Program signer bump: {:?}", program_signer_bump);

    CreateCollectionV2Cpi {
        __program: ctx.accounts.mpl_core,
        collection: ctx.accounts.core_collection,
        update_authority: Some(authority),
        payer: ctx.accounts.payer,
        system_program: ctx.accounts.system_program,
        __args: CreateCollectionV2InstructionArgs {
            name: old_collection_metadata.name,
            uri: old_collection_metadata.uri,
            plugins: Some(vec![
                PluginAuthorityPair {
                    plugin: Plugin::Royalties(Royalties {
                        basis_points: old_collection_metadata.seller_fee_basis_points,
                        creators: old_collection_metadata
                            .creators
                            .unwrap()
                            .into_iter()
                            .map(|creator| Creator {
                                address: creator.address,
                                percentage: creator.share,
                            })
                            .collect(),
                        rule_set: mpl_core::types::RuleSet::None,
                    }),
                    authority: None,
                },
                PluginAuthorityPair {
                    plugin: Plugin::UpdateDelegate(UpdateDelegate {
                        additional_delegates: vec![],
                    }),
                    authority: Some(mpl_core::types::PluginAuthority::Address {
                        address: PROGRAM_SIGNER,
                    }),
                },
            ]),
            external_plugin_adapters: None,
        },
    }
    .invoke_signed(&[&[
        PREFIX.as_bytes(),
        &old_collection_metadata.mint.to_bytes(),
        &[bump],
    ]])
}

fn migrate_token_metadata<'a>(accounts: &'a [AccountInfo<'a>]) -> ProgramResult {
    // Accounts.
    let ctx = MigrateTokenMetadataAccounts::context(accounts)?;

    // Guards.
    if *ctx.accounts.mpl_core.key != mpl_core::ID {
        return Err(BglMigratorError::InvalidMplCoreProgram.into());
    }

    if *ctx.accounts.mpl_token_metadata.key != mpl_token_metadata::ID {
        return Err(BglMigratorError::InvalidTokenMetadataProgram.into());
    }

    let old_metadata = Metadata::safe_deserialize(&ctx.accounts.metadata.data.borrow())?;
    let old_collection_metadata =
        Metadata::safe_deserialize(&ctx.accounts.collection_metadata.data.borrow())?;

    if *ctx.accounts.update_authority.key != old_collection_metadata.update_authority {
        return Err(BglMigratorError::IncorrectUpdateAuthority.into());
    }

    let start_lamports = ctx.accounts.payer.lamports();
    // Create the new Core Asset.
    CreateV2Cpi {
        __program: ctx.accounts.mpl_core,
        asset: ctx.accounts.asset,
        collection: Some(ctx.accounts.collection),
        authority: Some(ctx.accounts.program_signer),
        payer: ctx.accounts.payer,
        owner: Some(ctx.accounts.payer),
        update_authority: None,
        system_program: ctx.accounts.system_program,
        log_wrapper: None,
        __args: CreateV2InstructionArgs {
            data_state: DataState::AccountState,
            name: old_metadata.name,
            uri: old_metadata.uri,
            plugins: None,
            external_plugin_adapters: None,
        },
    }
    .invoke_signed(&[&[PREFIX.as_bytes(), &[PROGRAM_SIGNER_BUMP]]])?;

    // Burn the old token.
    BurnV1Cpi {
        __program: ctx.accounts.mpl_token_metadata,
        authority: ctx.accounts.payer,
        collection_metadata: Some(ctx.accounts.collection_metadata),
        metadata: ctx.accounts.metadata,
        edition: Some(ctx.accounts.edition),
        mint: ctx.accounts.mint,
        token: ctx.accounts.token,
        master_edition: None,
        master_edition_mint: None,
        master_edition_token: None,
        edition_marker: None,
        token_record: ctx.accounts.token_record,
        system_program: ctx.accounts.system_program,
        sysvar_instructions: ctx.accounts.sysvar_instructions,
        spl_token_program: ctx.accounts.spl_token_program,
        __args: BurnV1InstructionArgs { amount: 1 },
    }
    .invoke()?;
    let end_lamports = ctx.accounts.payer.lamports();
    let lamports_sub_returns = end_lamports
        .checked_sub(start_lamports)
        .ok_or(BglMigratorError::NumericalOverflow)?
        .checked_sub(OWNER_RETURN)
        .ok_or(BglMigratorError::NumericalOverflow)?
        .checked_sub(CREATOR_RETURN)
        .ok_or(BglMigratorError::NumericalOverflow)?;

    invoke(
        &system_instruction::transfer(
            ctx.accounts.payer.key,
            ctx.accounts.program_signer.key,
            lamports_sub_returns,
        ),
        &[
            ctx.accounts.payer.clone(),
            ctx.accounts.program_signer.clone(),
            ctx.accounts.system_program.clone(),
        ],
    )?;

    invoke(
        &system_instruction::transfer(
            ctx.accounts.payer.key,
            ctx.accounts.update_authority.key,
            CREATOR_RETURN,
        ),
        &[
            ctx.accounts.payer.clone(),
            ctx.accounts.update_authority.clone(),
            ctx.accounts.system_program.clone(),
        ],
    )
}
