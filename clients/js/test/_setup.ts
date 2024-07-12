/* eslint-disable import/no-extraneous-dependencies */
import { createUmi as basecreateUmi } from '@metaplex-foundation/umi-bundle-tests';
import { generateSigner, PublicKey, Umi } from '@metaplex-foundation/umi';
import { createNft, findMetadataPda, mplTokenMetadata, verifyCollectionV1 } from '@metaplex-foundation/mpl-token-metadata';
import { bglMigrator } from '../src';

export const createUmi = async () =>
  (await basecreateUmi()).use(bglMigrator()).use(mplTokenMetadata());

export async function createNftCollection(umi: Umi): Promise<{ collection: PublicKey; nfts: PublicKey[] }> {
  const collectionMint = generateSigner(umi);

  await createNft(umi, {
    mint: collectionMint,
    name: 'Test Collection',
    uri: 'www.collection.com',
    sellerFeeBasisPoints: {
      basisPoints: 500n,
      identifier: '%',
      decimals: 2
    },
    isCollection: true,
  }).sendAndConfirm(umi, { confirm: { commitment: 'finalized' } });

  const nfts = [];
  for (let i = 0; i < 5; i += 1) {
    const nftMint = generateSigner(umi);
    // eslint-disable-next-line no-await-in-loop
    await createNft(umi, {
      name: `Test NFT ${i}`,
      uri: `www.example.com/${i}`,
      sellerFeeBasisPoints: {
        basisPoints: 5n,
        identifier: '%',
        decimals: 2
      },
      mint: nftMint,
      collection: { key: collectionMint.publicKey, verified: false },
    }).append(verifyCollectionV1(umi, {
      metadata: findMetadataPda(umi, { mint: nftMint.publicKey }),
      collectionMint: collectionMint.publicKey,
    })).sendAndConfirm(umi, { confirm: { commitment: 'finalized' } });
    nfts.push(nftMint.publicKey);
  }

  return { collection: collectionMint.publicKey, nfts };
}