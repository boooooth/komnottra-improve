import { GoogleGenAI } from '@google/genai';

export interface ExtractedReceiptResult {
  vendor: string;
  receiptNo: string;
  date: string;
  currency: 'KHR' | 'USD';
  total: number;
  amountExclVat: number;
  vat: number;
  vendorTin: string;
  category: string;
  department: string;
  confidence: number;
  warning: string | null;
  note: string;
}

export interface ExtractReceiptOptions {
  categories?: string[];
  departments?: string[];
}

/**
 * Extracts structured financial receipt data from an image using Google Gemini Vision
 * Supports dynamic categories and departments configured by workspace owner
 */
export async function extractReceiptWithGemini(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  options?: ExtractReceiptOptions
): Promise<ExtractedReceiptResult | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const aiBaseUrl = process.env.AI_BASE_URL;

  if (!geminiApiKey && !aiBaseUrl) {
    return null;
  }

  const customCategories = (options?.categories && options.categories.length > 0)
    ? options.categories
    : ["Meals", "Transport", "Office supplies", "Utilities", "Other"];

  const customDepartments = (options?.departments && options.departments.length > 0)
    ? options.departments
    : ["Administration", "Sales", "Engineering", "Operations", "General"];

  const categoriesListStr = customCategories.map((c) => `"${c}"`).join(', ');
  const departmentsListStr = customDepartments.map((d) => `"${d}"`).join(', ');

  const prompt = `You are an expert Cambodian financial auditor and OCR parser specializing in Khmer and English receipts, tax invoices, and payment slips (such as ABA KHQR, PassApp, Lucky Supermarket, EDC electric bills).
Analyze the provided receipt image and extract the following financial fields into strict JSON:
1. vendor: Merchant or business name (in English or Khmer).
2. receiptNo: The invoice or receipt number (e.g. INV-0451, PA-88213), or generate a short reference if missing.
3. date: Date in DD/MM/YYYY format.
4. currency: "KHR" or "USD". If both are shown, pick the primary transaction currency.
5. total: Total numeric amount paid (numbers only, no symbols).
6. amountExclVat: Subtotal before VAT if tax is explicitly itemized; otherwise equal to total.
7. vat: Explicit VAT amount only if clearly printed as VAT, tax, or អាករ on the receipt. If no VAT is explicitly shown or itemized, return 0.
8. vendorTin: Cambodian Tax Identification Number starting with K or L (e.g. K001-100234567). If not found, return "—".
9. category: Choose the best matching category from this company's approved list: [${categoriesListStr}]. If none match, pick the closest one or "Other".
10. department: Choose the best matching department for this expense from this company's list: [${departmentsListStr}]. If unclear, pick the closest one or "General".
11. confidence: An integer between 50 and 99 representing OCR confidence.
12. warning: Any warning if text is partly handwritten or faded (e.g., "Partly handwritten: check amount"), or null if clear.
13. note: Short description of purchased goods or service.

Return ONLY the raw JSON object without markdown formatting.`;

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  // 1. Try Direct Google Gemini API first if GEMINI_API_KEY is configured
  if (geminiApiKey && geminiApiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
            ],
          },
        ],
        config: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          vendor: parsed.vendor?.trim() || '',
          receiptNo: parsed.receiptNo?.trim() || '',
          date: parsed.date || new Date().toLocaleDateString('en-GB'),
          currency: parsed.currency === 'USD' ? 'USD' : 'KHR',
          total: parseFloat(parsed.total) || 0,
          amountExclVat: parseFloat(parsed.amountExclVat) || 0,
          vat: parseFloat(parsed.vat) || 0,
          vendorTin: parsed.vendorTin || '—',
          category: parsed.category || 'General',
          department: parsed.department?.trim() || 'General',
          confidence: parseInt(parsed.confidence, 10) || 92,
          warning: parsed.warning || null,
          note: parsed.note || '',
        };
      }
    } catch (error) {
      console.error('Google Gemini API extraction error:', error);
    }
  }

  // 2. Fallback to Vision Gateway (OmniRoute / serka-space) if configured
  if (aiBaseUrl) {
    try {
      const apiKey = process.env.AI_API_KEY || 'sk-omniroute';
      const model = process.env.CHAT_MODEL || 'serka-space';
      const imageUrl = `data:${mimeType};base64,${cleanBase64}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(`${aiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          temperature: 0.1,
          reasoning_effort: process.env.REASONING_EFFORT || 'none',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            vendor: parsed.vendor?.trim() || '',
            receiptNo: parsed.receiptNo?.trim() || '',
            date: parsed.date || new Date().toLocaleDateString('en-GB'),
            currency: parsed.currency === 'USD' ? 'USD' : 'KHR',
            total: parseFloat(parsed.total) || 0,
            amountExclVat: parseFloat(parsed.amountExclVat) || 0,
            vat: parseFloat(parsed.vat) || 0,
            vendorTin: parsed.vendorTin || '—',
            category: parsed.category || 'General',
            department: parsed.department?.trim() || 'General',
            confidence: parseInt(parsed.confidence, 10) || 92,
            warning: parsed.warning || null,
            note: parsed.note || '',
          };
        }
      } else {
        console.error('AI Vision Gateway error response:', res.status, await res.text());
      }
    } catch (proxyErr) {
      console.error('Vision Gateway extraction error:', proxyErr);
    }
  }

  return null;
}
