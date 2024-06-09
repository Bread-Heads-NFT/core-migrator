import { UmiPlugin } from '@metaplex-foundation/umi';
import { createBglMigratorProgram } from './generated';

export const bglMigrator = (): UmiPlugin => ({
  install(umi) {
    umi.programs.add(createBglMigratorProgram(), false);
  },
});
