/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  ClusterFilter,
  Context,
  Program,
  PublicKey,
} from '@metaplex-foundation/umi';
import {
  getBglMigratorErrorFromCode,
  getBglMigratorErrorFromName,
} from '../errors';

export const BGL_MIGRATOR_PROGRAM_ID =
  'M1GRRnVpm1aRp9GHtzktTzva9v2zz7ujcdCeUSS1Ju3' as PublicKey<'M1GRRnVpm1aRp9GHtzktTzva9v2zz7ujcdCeUSS1Ju3'>;

export function createBglMigratorProgram(): Program {
  return {
    name: 'bglMigrator',
    publicKey: BGL_MIGRATOR_PROGRAM_ID,
    getErrorFromCode(code: number, cause?: Error) {
      return getBglMigratorErrorFromCode(code, this, cause);
    },
    getErrorFromName(name: string, cause?: Error) {
      return getBglMigratorErrorFromName(name, this, cause);
    },
    isOnCluster() {
      return true;
    },
  };
}

export function getBglMigratorProgram<T extends Program = Program>(
  context: Pick<Context, 'programs'>,
  clusterFilter?: ClusterFilter
): T {
  return context.programs.get<T>('bglMigrator', clusterFilter);
}

export function getBglMigratorProgramId(
  context: Pick<Context, 'programs'>,
  clusterFilter?: ClusterFilter
): PublicKey {
  return context.programs.getPublicKey(
    'bglMigrator',
    BGL_MIGRATOR_PROGRAM_ID,
    clusterFilter
  );
}
