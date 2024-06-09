const path = require("path");
const { generateIdl } = require("@metaplex-foundation/shank-js");

const idlDir = path.join(__dirname, "..", "idls");
const binaryInstallDir = path.join(__dirname, "..", ".crates");
const programDir = path.join(__dirname, "..", "programs");

generateIdl({
  generator: "shank",
  programName: "bgl_migrator_program",
  programId: "M1GRRnVpm1aRp9GHtzktTzva9v2zz7ujcdCeUSS1Ju3",
  idlDir,
  binaryInstallDir,
  programDir: path.join(programDir, "bgl-migrator"),
});
