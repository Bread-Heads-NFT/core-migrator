use num_derive::FromPrimitive;
use solana_program::{
    decode_error::DecodeError,
    msg,
    program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;

#[derive(Error, Clone, Debug, Eq, PartialEq, FromPrimitive)]
pub enum BglMigratorError {
    /// 0 - Invalid System Program
    #[error("Invalid System Program")]
    InvalidSystemProgram,

    /// 1 - Error deserializing account
    #[error("Error deserializing account")]
    DeserializationError,

    /// 2 - Error serializing account
    #[error("Error serializing account")]
    SerializationError,

    /// 3 - Invalid MPL Core Program
    #[error("Invalid MPL Core Program")]
    InvalidMplCoreProgram,

    /// 4 - Invalid old collection account owner
    #[error("Invalid old collection account owner")]
    InvalidOldCollectionAccountOwner,

    /// 5 - Authority must sign
    #[error("Authority must sign")]
    AuthorityMustSign,

    /// 6 - Update authority must sign
    #[error("Update authority must sign")]
    UpdateAuthorityMustSign,

    /// 7 - Invalid new collection account
    #[error("Invalid new collection account")]
    InvalidNewCollectionAccount,

    /// 8 - Invalid Token Metadata Program
    #[error("Invalid Token Metadata Program")]
    InvalidTokenMetadataProgram,

    /// 9 - Incorrect Update Authority
    #[error("Incorrect Update Authority")]
    IncorrectUpdateAuthority,

    /// 10 - Numerical Overflow
    #[error("Numerical Overflow")]
    NumericalOverflow,
}

impl PrintProgramError for BglMigratorError {
    fn print<E>(&self) {
        msg!(&self.to_string());
    }
}

impl From<BglMigratorError> for ProgramError {
    fn from(e: BglMigratorError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for BglMigratorError {
    fn type_of() -> &'static str {
        "Bgl Migrator Error"
    }
}
