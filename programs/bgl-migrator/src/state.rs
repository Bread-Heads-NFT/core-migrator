use solana_program::{pubkey, pubkey::Pubkey};

pub(crate) const PREFIX: &str = "migrator";
pub(crate) const PROGRAM_SIGNER: Pubkey = pubkey!("DwqRD2HwFvP8bYyeQSZY7nYJEgG5RAKgogURUErgPomn");
pub(crate) const PROGRAM_SIGNER_BUMP: u8 = 255;

pub(crate) const OWNER_RETURN: u64 = 5_000_000;
pub(crate) const CREATOR_RETURN: u64 = 500_000;
