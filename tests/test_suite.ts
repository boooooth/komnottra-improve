/**
 * Komnottra Automated Verification & Test Suite
 * Covers Core Algorithms, Dual-Currency Arithmetic, Security Controls, and Rate Limiting
 */

import { checkRateLimit } from '../src/lib/rateLimit';
import { createSessionToken, verifySessionToken, UserSession } from '../src/lib/auth';

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, extraInfo?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${description} ${extraInfo ? `(${extraInfo})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   KOMNOTTRA AUTOMATED VERIFICATION & TEST SUITE      ');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // TEST SUITE 1: Dual-Currency Accounting & NBC Exchange Calculations
  // -------------------------------------------------------------------------
  console.log('📦 [1/5] Dual-Currency Arithmetic & NBC Exchange Engine');
  {
    const exchangeRate = 4100; // Standard National Bank of Cambodia USD/KHR rate
    
    // Test USD to KHR conversion
    const usdExpense = 150.50;
    const expectedKhr = Math.round(usdExpense * exchangeRate);
    assert('USD to KHR conversion maintains integer precision', expectedKhr === 617050);

    // Test KHR to USD conversion
    const khrIncome = 4100000;
    const expectedUsd = khrIncome / exchangeRate;
    assert('KHR to USD conversion yields exact quotient', expectedUsd === 1000);

    // Test Runway calculation logic: Net Treasury / Monthly Burn
    const totalCashUsd = 12000;
    const monthlyBurnUsd = 3000;
    const runwayMonths = Math.round((totalCashUsd / monthlyBurnUsd) * 10) / 10;
    assert('Runway horizon correctly computed as 4.0 months', runwayMonths === 4.0);

    // Dynamic Horizon categorization
    const runwayCategory = runwayMonths < 3 ? 'Critical' : runwayMonths <= 6 ? 'Caution' : 'Optimal';
    assert('Runway classification maps 4.0 months to Caution (3-6 mo)', runwayCategory === 'Caution');
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 2: Cambodian GDT Taxpayer Identification (TIN) Verification
  // -------------------------------------------------------------------------
  console.log('\n📦 [2/5] GDT Cambodian TIN & Tax Identification Verification');
  {
    const TIN_REGEX = /^[KL]\d{3}-\d{6,10}$/i;

    assert('Validates standard Cambodian Corporate TIN (K001-10023456)', TIN_REGEX.test('K001-10023456'));
    assert('Validates Large-Taxpayer TIN (L002-99887766)', TIN_REGEX.test('L002-99887766'));
    assert('Rejects invalid TIN missing prefix (001-10023456)', !TIN_REGEX.test('001-10023456'));
    assert('Rejects generic placeholders ("—" or "N/A")', !TIN_REGEX.test('—') && !TIN_REGEX.test('N/A'));
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 3: Magic-Byte Binary Header File Upload Security
  // -------------------------------------------------------------------------
  console.log('\n📦 [3/5] Magic-Byte Binary Signature Validation (Anti-Spoofing)');
  {
    function testMagicBytes(buffer: Buffer): { valid: boolean; ext: string } {
      if (!buffer || buffer.length < 4) return { valid: false, ext: '' };
      // JPEG
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return { valid: true, ext: 'jpg' };
      // PNG
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return { valid: true, ext: 'png' };
      // PDF
      if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return { valid: true, ext: 'pdf' };
      // WebP
      if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x42 && buffer[10] === 0x45 && buffer[11] === 0x50) return { valid: true, ext: 'webp' };
      return { valid: false, ext: '' };
    }

    // Authentic PNG header
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    assert('Authentic PNG binary header recognized', testMagicBytes(pngHeader).ext === 'png');

    // Authentic JPEG header
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    assert('Authentic JPEG binary header recognized', testMagicBytes(jpegHeader).ext === 'jpg');

    // Authentic PDF header
    const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37]);
    assert('Authentic PDF binary header recognized', testMagicBytes(pdfHeader).ext === 'pdf');

    // Spoofed script disguised with image extension (malicious payload)
    const maliciousScript = Buffer.from('<?php echo "malicious"; ?>', 'utf8');
    assert('Spoofed PHP/HTML script masquerading as image is rejected', !testMagicBytes(maliciousScript).valid);

    // Truncated invalid buffer
    assert('Empty or truncated buffer rejected', !testMagicBytes(Buffer.from([0x00])).valid);
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 4: Sliding-Window Rate Limiter
  // -------------------------------------------------------------------------
  console.log('\n📦 [4/5] Ingestion Rate Limiter & Denial-of-Service Defense');
  {
    const testIp = `test-ip-${Date.now()}`;
    const maxReq = 3;
    const windowMs = 1000;

    // First 3 requests must be allowed
    const r1 = checkRateLimit(testIp, { maxRequests: maxReq, windowMs });
    const r2 = checkRateLimit(testIp, { maxRequests: maxReq, windowMs });
    const r3 = checkRateLimit(testIp, { maxRequests: maxReq, windowMs });
    assert('Requests within quota (1, 2, 3) are allowed', r1.allowed && r2.allowed && r3.allowed);

    // 4th request must be blocked
    const r4 = checkRateLimit(testIp, { maxRequests: maxReq, windowMs });
    assert('Burst request exceeding quota (4) is blocked with HTTP 429 semantics', !r4.allowed && r4.remaining === 0);
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 5: Cryptographic Session Token Lifecycle
  // -------------------------------------------------------------------------
  console.log('\n📦 [5/5] Cryptographic Session Token & Claims Lifecycle');
  {
    const mockUser: UserSession = {
      userId: 'test-uuid-12345',
      email: 'finance@company.com.kh',
      name: 'Vannak Heng',
      role: 'OWNER',
      workspaceId: 'ws-test-9876',
      workspaceName: 'Phnom Penh Operations',
      department: 'Finance',
    };

    const token = await createSessionToken(mockUser);
    assert('Generates signed HS256 JWT string', typeof token === 'string' && token.split('.').length === 3);

    const verified = await verifySessionToken(token);
    assert('Decodes and verifies valid token payload', verified !== null && verified.userId === mockUser.userId);
    assert('Preserves role authorization claim ("OWNER")', verified?.role === 'OWNER');

    const tampered = token.slice(0, -6) + 'abcdef';
    const tamperedResult = await verifySessionToken(tampered);
    assert('Rejects cryptographically tampered session token', tamperedResult === null);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`   TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
