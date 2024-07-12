/* eslint-disable no-await-in-loop */
import test from 'ava';
import { fetchDigitalAsset, fetchDigitalAssetWithTokenByMint, findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { CollectionV1, Creator, fetchCollection } from '@metaplex-foundation/mpl-core';
import { string, publicKey as publicKeySerializer } from '@metaplex-foundation/umi/serializers';
import { generateSigner, isSome, publicKey, TransactionBuilder } from '@metaplex-foundation/umi';
import { BGL_MIGRATOR_PROGRAM_ID, migrateTokenMetadata, PROGRAM_SIGNER, startTokenMetadata } from '../src';
import { createNftCollection, createUmi } from './_setup';

test('it can migrate a token metadata nft', async (t) => {
  // Given a Umi instance and a new signer.
  const umi = await createUmi();
  const { collection, nfts } = await createNftCollection(umi);

  const coreCollection = umi.eddsa.findPda(BGL_MIGRATOR_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('migrator'),
    publicKeySerializer().serialize(collection),
  ]);
  const tmCollectionMetadata = findMetadataPda(umi, { mint: collection });
  await startTokenMetadata(umi, {
    tmCollectionMetadata,
    coreCollection,
  }).sendAndConfirm(umi);

  const oldCollection = await fetchDigitalAsset(umi, collection);
  const newCollection = await fetchCollection(umi, publicKey(coreCollection));

  let creators: Creator[] = [];
  if (isSome(oldCollection.metadata.creators)) {
    creators = oldCollection.metadata.creators.value.map((creator) => (<Creator>{
      address: creator.address,
      percentage: creator.share,
    }));
  } else {
    t.fail('Expected creators to be Some');
  }
  // The new collection was created with the correct data.
  t.like(newCollection, <CollectionV1>{
    name: oldCollection.metadata.name,
    uri: oldCollection.metadata.uri,
    numMinted: 0,
    currentSize: 0,
    updateAuthority: oldCollection.metadata.updateAuthority,
    royalties: {
      basisPoints: oldCollection.metadata.sellerFeeBasisPoints,
      ruleSet: { type: 'None' },
      creators,
    },
    updateDelegate: {
      authority: { type: 'Address', address: PROGRAM_SIGNER },
    },
  });

  let builder = new TransactionBuilder();
  // eslint-disable-next-line no-restricted-syntax
  for (const nft of nfts) {
    console.log(`Migrating ${nft}`);
    const oldNft = await fetchDigitalAssetWithTokenByMint(umi, nft);
    const asset = generateSigner(umi);
    builder = builder.add(migrateTokenMetadata(umi, {
      collectionMetadata: tmCollectionMetadata,
      metadata: oldNft.metadata.publicKey,
      edition: oldNft.edition!.publicKey,
      mint: oldNft.mint.publicKey,
      token: oldNft.token.publicKey,
      updateAuthority: oldCollection.metadata.updateAuthority,
      asset,
      collection: coreCollection,
    }));
  }

  const txes = builder.unsafeSplitByTransactionSize(umi);
  // eslint-disable-next-line no-restricted-syntax
  for (const tx of txes) {
    const result = await tx.sendAndConfirm(umi);
    console.log(await umi.rpc.getTransaction(result.signature));
  }
});
