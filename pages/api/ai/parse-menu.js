// pages/api/ai/parse-menu.js

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

const MENU_SCHEMA = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          category: { type: "STRING" },
          price: { type: "NUMBER" },
          description: { type: "STRING" }
        },
        required: ["name", "price"]
      }
    }
  },
  required: ["items"]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { image } = req.body || {};
    if (!image) return res.status(400).json({ message: "No image provided" });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ message: "Gemini API key not configured on server (GEMINI_API_KEY environment variable missing)." });

    const match = image.match(/^data:(.+);base64,(.*)$/);
    if (!match) return res.status(400).json({ message: "Invalid image format. Expected base64 data URI." });
    const mimeType = match[1];
    const base64Data = match[2];

    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extract menu items from the image into structured JSON format. For each item, capture the name, category (infer if not explicit, e.g., 'Starters', 'Mains', 'Drinks'), price (as a number), and a brief description if available." },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: "application/json",
          response_schema: MENU_SCHEMA
        }
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API Error Response:", errText);
        throw new Error(`Gemini API error (Status ${response.status})`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("AI returned no content in the expected format.");

    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    console.error("Parse Menu API Route Error:", err);
    return res.status(500).json({ message: err.message || "Internal Server Error during menu parsing" });
  }
}
