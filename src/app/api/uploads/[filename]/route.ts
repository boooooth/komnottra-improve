import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  context?: { params: Promise<{ filename: string }> | { filename: string } }
) {
  try {
    let filename = '';
    if (context?.params) {
      const resolved = await context.params;
      filename = resolved.filename;
    }
    if (!filename) {
      const parts = req.nextUrl.pathname.split('/');
      filename = parts[parts.length - 1];
    }

    // Sanitize to prevent path traversal
    const safeName = path.basename(decodeURIComponent(filename));
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Image Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = safeName.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'pdf') contentType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving dynamic upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
