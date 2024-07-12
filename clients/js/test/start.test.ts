import test from 'ava';
import { fetchDigitalAsset, findMetadataPda } from '@metaplex-foundation/mpl-token-metadata';
import { CollectionV1, Creator, fetchCollection } from '@metaplex-foundation/mpl-core';
import { string, publicKey as publicKeySerializer } from '@metaplex-foundation/umi/serializers';
import { isSome, publicKey } from '@metaplex-foundation/umi';
import { BGL_MIGRATOR_PROGRAM_ID, PROGRAM_SIGNER, startTokenMetadata } from '../src';
import { createNftCollection, createUmi } from './_setup';

test('it can start a token metadata migration', async (t) => {
  // Given a Umi instance and a new signer.
  const umi = await createUmi();
  const { collection } = await createNftCollection(umi);

  const coreCollection = umi.eddsa.findPda(BGL_MIGRATOR_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('migrator'),
    publicKeySerializer().serialize(collection),
  ]);
  await startTokenMetadata(umi, {
    tmCollectionMetadata: findMetadataPda(umi, { mint: collection }),
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
});
