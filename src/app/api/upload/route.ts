import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: 'cwp-11ty',
});

const bucketName = 'cwp-11ty';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size must be less than 2MB' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate image dimensions using sharp
    let imageMetadata;
    try {
      imageMetadata = await sharp(buffer).metadata();
    } catch (_) {
      return NextResponse.json({ 
        error: 'Invalid image file' 
      }, { status: 400 });
    }

    // Check dimensions (max 2000x2000)
    const maxDimension = 2000;
    if (!imageMetadata.width || !imageMetadata.height) {
      return NextResponse.json({ 
        error: 'Could not determine image dimensions' 
      }, { status: 400 });
    }

    if (imageMetadata.width > maxDimension || imageMetadata.height > maxDimension) {
      return NextResponse.json({ 
        error: `Image dimensions must be less than ${maxDimension}x${maxDimension} pixels. Current: ${imageMetadata.width}x${imageMetadata.height}` 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Upload to Google Cloud Storage
    const bucket = storage.bucket(bucketName);
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true, // Make the file publicly accessible
    });

    return NextResponse.json({ 
      fileName,
      url: `https://storage.googleapis.com/${bucketName}/${fileName}`,
      dimensions: {
        width: imageMetadata.width,
        height: imageMetadata.height
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' }, 
      { status: 500 }
    );
  }
}
