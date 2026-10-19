import { NextRequest, NextResponse } from 'next/server';
import { extractReceiptWithGemini } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import fs from 'fs';
import path from 'path';

// RISK-03 Remediated: Magic-byte header validation for authentic binary payloads
function detectAndValidateMagicBytes(buffer: Buffer): { valid: boolean; mimeType: string; ext: string } {
  if (!buffer || buffer.length < 4) {
    return { valid: false, mimeType: '', ext: '' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, mimeType: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, mimeType: 'image/png', ext: 'png' };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x42 && buffer[10] === 0x45 && buffer[11] === 0x50
  ) {
    return { valid: true, mimeType: 'image/webp', ext: 'webp' };
  }

  // PDF: %PDF (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, mimeType: 'application/pdf', ext: 'pdf' };
  }

  return { valid: false, mimeType: '', ext: '' };
}

export async function POST(req: NextRequest) {
  try {
    // RISK-04 Remediated: Sliding-window rate limiting (30 requests/minute per client IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`scan:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded for scan requests. Please wait a moment before scanning more receipts.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)) },
        }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let base64Image = '';
    let mimeType = 'image/jpeg';
    let savedImageUrl = '';
    let explicitCategories: string[] = [];
    let explicitDepartments: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const catField = formData.get('categories') as string | null;
      const deptField = formData.get('departments') as string | null;
      if (catField) {
        try { explicitCategories = JSON.parse(catField); } catch {}
      }
      if (deptField) {
        try { explicitDepartments = JSON.parse(deptField); } catch {}
      }

      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());

        // Validate authentic binary signatures (prevent disguised executables/scripts)
        const magic = detectAndValidateMagicBytes(buffer);
        if (!magic.valid) {
          return NextResponse.json(
            { success: false, error: 'Invalid file format. Only authentic PNG, JPEG, WebP, and PDF files are accepted.' },
            { status: 400 }
          );
        }

        mimeType = magic.mimeType;
        const ext = magic.ext;
        base64Image = buffer.toString('base64');

        // Save image to public/uploads/ with verified safe extension and unique name
        const fileName = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        savedImageUrl = `/uploads/${fileName}`;
      }
    } else if (contentType.includes('application/json')) {
      const json = await req.json();
      base64Image = json.image || '';
      mimeType = json.mimeType || 'image/jpeg';
      if (Array.isArray(json.categories)) explicitCategories = json.categories;
      if (Array.isArray(json.departments)) explicitDepartments = json.departments;
      if (base64Image) {
        const cleanBase = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase, 'base64');

        // Validate authentic binary signatures
        const magic = detectAndValidateMagicBytes(buffer);
        if (!magic.valid) {
          return NextResponse.json(
            { success: false, error: 'Invalid file format. Uploaded base64 payload is not a valid PNG, JPEG, WebP, or PDF.' },
            { status: 400 }
          );
        }

        mimeType = magic.mimeType;
        const ext = magic.ext;
        const fileName = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        savedImageUrl = `/uploads/${fileName}`;
      }
    }

    if (!base64Image && !savedImageUrl) {
      return NextResponse.json(
        { success: false, error: 'Please provide a receipt image to scan' },
        { status: 400 }
      );
    }

    // Fetch dynamic categories and departments configured by the workspace owner
    const session = await getCurrentUser();
    let categories: string[] = explicitCategories;
    let departments: string[] = explicitDepartments;

    if (session?.workspaceId && (categories.length === 0 || departments.length === 0)) {
      const ws = await prisma.workspace.findUnique({
        where: { id: session.workspaceId },
        select: { expenseCodes: true, departments: true },
      });
      if (ws) {
        if (categories.length === 0) {
          try {
            const parsed = JSON.parse(ws.expenseCodes || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) categories = parsed;
          } catch {}
        }
        if (departments.length === 0) {
          try {
            const parsed = JSON.parse(ws.departments || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) departments = parsed;
          } catch {}
        }
      }
    }

    // 1. Try Live Google Gemini Vision OCR with dynamic prompt
    if (base64Image) {
      const geminiResult = await extractReceiptWithGemini(base64Image, mimeType, { categories, departments });
      if (geminiResult) {
        return NextResponse.json({
          success: true,
          extracted: {
            ...geminiResult,
            imageUrl: savedImageUrl || (base64Image ? `data:${mimeType};base64,${base64Image}` : ''),
          },
        });
      }
    }

    // 2. Real User Upload Fallback
    return NextResponse.json({
      success: true,
      extracted: {
        vendor: '',
        receiptNo: '',
        date: new Date().toLocaleDateString('en-GB'),
        currency: 'KHR',
        total: 0,
        amountExclVat: 0,
        vat: 0,
        vendorTin: '—',
        category: categories.length > 0 ? categories[0] : 'General',
        department: departments.length > 0 ? departments[0] : (session?.department || 'General'),
        confidence: 85,
        warning: 'Please review and fill in receipt details.',
        note: '',
        imageUrl: savedImageUrl || (base64Image ? `data:${mimeType};base64,${base64Image}` : ''),
      },
    });
  } catch (error: any) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Scan failed' },
      { status: 500 }
    );
  }
}
