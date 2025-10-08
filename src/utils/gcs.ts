import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'cwp-11ty',
});

export async function moveImageBetweenBuckets({
  filePath,
  fromBucket,
  toBucket,
}: {
  filePath: string;
  fromBucket: string;
  toBucket: string;
}): Promise<void> {
  const srcFile = storage.bucket(fromBucket).file(filePath);
  await srcFile.copy(storage.bucket(toBucket).file(filePath));
  await srcFile.delete();
}
