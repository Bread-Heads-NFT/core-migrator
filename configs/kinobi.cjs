const path = require("path");
const k = require("@metaplex-foundation/kinobi");
const { start } = require("repl");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instanciate Kinobi.
const kinobi = k.createFromIdls([path.join(idlDir, "bgl_migrator_program.json")]);

// Update programs.
kinobi.update(
  new k.updateProgramsVisitor({
    bglMigratorProgram: { name: "bglMigrator" },
  })
);

// Update accounts.
// kinobi.update(
//   new k.updateAccountsVisitor({
//     coreCollection: {
//       seeds: [
//         k.constantPdaSeedNodeFromString("migrator"),
//         k.variablePdaSeedNode("oldCollectionMint", k.publicKeyTypeNode(), "The mint address of the old collection."),
//       ],
//     },
//     mplTokenMetadata: {
//       defaultValue: k.publicKeyValueNode("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
//     },
//     programSigner: {
//       defaultValue: k.publicKeyValueNode("DwqRD2HwFvP8bYyeQSZY7nYJEgG5RAKgogURUErgPomn")
//     },
//   })
// );

kinobi.update(
  k.updateInstructionsVisitor({
    startTokenMetadata: {
      accounts: {
        coreCollection: {
          seeds: [
            k.constantPdaSeedNodeFromString("migrator"),
            k.variablePdaSeedNode("oldCollectionMint", k.publicKeyTypeNode(), "The mint address of the old collection."),
          ],
        },
        mplCore: {
          defaultValue: k.publicKeyValueNode("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d")
        },
      }
    },
    migrateTokenMetadata: {
      accounts: {
        mplCore: { defaultValue: k.publicKeyValueNode("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d") },
        mplTokenMetadata: { defaultValue: k.publicKeyValueNode("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s") },
        programSigner: { defaultValue: k.publicKeyValueNode("DwqRD2HwFvP8bYyeQSZY7nYJEgG5RAKgogURUErgPomn") }
      }
    },
  })
);


// Update instructions.
// kinobi.update(
//   new k.updateInstructionsVisitor({
//     create: {
//       byteDeltas: [
//         k.instructionByteDeltaNode(k.accountLinkNode("myAccount")),
//       ],
//     },
//   })
// );

// Set ShankAccount discriminator.
// const key = (name) => ({ field: "key", value: k.enumValueNode("Key", name) });
// kinobi.update(
//   new k.setAccountDiscriminatorFromFieldVisitor({
//     myAccount: key("MyAccount"),
//     myPdaAccount: key("MyPdaAccount"),
//   })
// );

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
const prettier = require(path.join(clientDir, "js", ".prettierrc.json"));
kinobi.accept(new k.renderJavaScriptVisitor(jsDir, { prettier }));

// Render Rust.
const crateDir = path.join(clientDir, "rust");
const rustDir = path.join(clientDir, "rust", "src", "generated");
kinobi.accept(
  new k.renderRustVisitor(rustDir, {
    formatCode: true,
    crateFolder: crateDir,
  })
);
