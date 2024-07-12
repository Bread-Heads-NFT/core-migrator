use borsh::{BorshDeserialize, BorshSerialize};
use shank::{ShankContext, ShankInstruction};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, ShankContext, ShankInstruction)]
#[rustfmt::skip]
pub enum BglMigratorInstruction {
    /// Start the migration process by creating the new Collection.
    #[account(0, name="tm_collection_metadata", desc = "The collection metadata account of the old collection")]
    #[account(1, writable, name="core_collection", desc = "The new collection account; this is a pda of the old collection mint address")]
    #[account(2, writable, signer, name="payer", desc = "The account paying for the storage fees")]
    #[account(3, signer, optional, name="authority", desc = "The update authority for the old and new collection, if different from the payer")]
    #[account(4, name="system_program", desc = "The system program")]
    #[account(5, name="mpl_core", desc = "The MPL Core program")]
    StartTokenMetadata,

    /// Migrate a Token Metadata NFT from the old collection to the new Core collection.
    #[account(0, writable, name="collection_metadata", desc="Metadata of the Collection")]
    #[account(1, writable, name="metadata", desc="Metadata (pda of ['metadata', program id, mint id])")]
    #[account(2, writable, name="edition", desc="Edition of the asset")]
    #[account(3, writable, name="mint", desc="Mint of token asset")]
    #[account(4, writable, name="token", desc="Token account to close")]
    #[account(5, optional, writable, name="token_record", desc="Token record account")]
    #[account(6, writable, signer, name="asset", desc = "The address of the new asset")]
    #[account(7, writable, name="collection", desc = "The collection to which the asset belongs")]
    #[account(8, writable, signer, name="payer", desc = "The account paying for the storage fees")]
    #[account(9, writable, name="program_signer", desc = "The program signer account")]
    #[account(10, writable, name="update_authority", desc = "The update authority for the old collection")]
    #[account(11, name="system_program", desc="System program")]
    #[account(12, name="sysvar_instructions", desc="Instructions sysvar account")]
    #[account(13, name="spl_token_program", desc="SPL Token Program")]
    #[account(14, name="mpl_core", desc = "The MPL Core program")]
    #[account(15, name="mpl_token_metadata", desc = "The MPL Token Metadata program")]
    MigrateTokenMetadata,
}
