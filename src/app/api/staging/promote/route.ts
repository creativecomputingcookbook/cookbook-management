import { NextRequest, NextResponse } from 'next/server';
import { verifyClaims } from '@/utils/verifyClaims';
import { Firestore } from '@google-cloud/firestore';
import { getImageFields } from '@/utils/imageFields';
import { moveImageBetweenBuckets } from '@/utils/gcs';
import buildsSchema from '@/schema/builds.json';
import foundationsSchema from '@/schema/foundations.json';
import { PageData, Schema } from '@/components/SchemaTypes';

const db = new Firestore({ projectId: 'cwp-11ty' });
const prodCollection = db.collection('cwp-pages');
const stagingCollection = db.collection('cwp-pages-staging');

const PROD_BUCKET = 'cwp-11ty';
const STAGING_BUCKET = 'cwp-11ty-staging';

function getSchemaForPage(page: PageData): Schema | null {
  // Simple example: use schema field or tags to determine schema
  if (page.schema === 'builds' || (page.tags && page.tags.includes('Builds'))) return buildsSchema;
  if (page.schema === 'foundations' || (page.tags && page.tags.includes('Foundations'))) return foundationsSchema;
  return null;
}

// lint disabled because PageData is too complex to type here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImagePaths(pageData: any, imageFields: string[]): string[] {
  const paths: string[] = [];
  // Top-level fields
  for (const field of imageFields) {
    // Direct field (e.g., 'src' for circuit)
    if (field in pageData) {
      if (typeof pageData[field] === 'string') paths.push(pageData[field]);
    }
    // Check in fields array
    if (Array.isArray(pageData.fields)) {
      for (const f of pageData.fields) {
        if (field in f && typeof f[field] === 'string') {
          paths.push(f[field]);
        }
        // For open_field_list (e.g., parsons_group, gallery)
        if (Array.isArray(f.fields)) {
          for (const sub of f.fields) {
            if (field in sub && typeof sub[field] === 'string') {
              paths.push(sub[field]);
            }
          }
        }
      }
    }
  }
  return paths;
}

// POST: Admin moves a staging page to production, including images
export async function POST(request: NextRequest) {
  const claims = await verifyClaims();
  if (!claims?.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'Page name required' }, { status: 400 });
  const stagingDoc = await stagingCollection.doc(name).get();
  if (!stagingDoc.exists) return NextResponse.json({ error: 'Staging page not found' }, { status: 404 });
  const pageData = stagingDoc.data() as PageData;
  if (!pageData) return NextResponse.json({ error: 'Staging page data missing' }, { status: 500 });
  const schema = getSchemaForPage(pageData);
  const imageFields = schema ? getImageFields(schema) : [];
  const imagePaths = extractImagePaths(pageData, imageFields);
  // Move images from staging to production bucket
  for (const imgPath of imagePaths) {
    if (
      typeof imgPath === 'string' &&
      imgPath.startsWith('https://storage.googleapis.com/cwp-11ty-staging/')
    ) {
      const filePath = imgPath.replace('https://storage.googleapis.com/cwp-11ty-staging/', '');
      await moveImageBetweenBuckets({
        filePath,
        fromBucket: STAGING_BUCKET,
        toBucket: PROD_BUCKET,
      });
    }
  }
  // Write to production collection
  await prodCollection.doc(name).set(pageData);
  // Delete from staging
  await stagingCollection.doc(name).delete();
  return NextResponse.json({ status: 'ok', movedImages: imagePaths });
}
