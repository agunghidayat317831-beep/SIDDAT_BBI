import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser settings for large payloads (e.g. image/pdf base64)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // API Route to extract total deposit (setoran) from receipt
  app.post("/api/logistics/extract-pad-receipt", async (req, res) => {
    try {
      const { padReceiptImage } = req.body;
      if (!padReceiptImage) {
        return res.status(400).json({ error: "Missing padReceiptImage parameter" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(400).json({ 
          error: "Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi atau tidak valid. Silakan atur GEMINI_API_KEY Anda di menu Settings (ikon gerigi) -> Secrets di pojok kanan bawah AI Studio agar fitur pembacaan otomatis ini dapat berfungsi." 
        });
      }

      // Parse data URL: data:image/...;base64,... or data:application/pdf;base64,...
      const match = padReceiptImage.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: "Format file tidak valid. Harus berupa base64 Data URL." });
      }

      const mimeType = match[1];
      const base64Data = match[2];

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: "Identify the total deposit / transfer / payment amount (nominal setoran / jumlah setoran / total setoran / jumlah uang / nominal pembayaran / total bayar) from this PAD receipt (bukti setoran / bukti pembayaran / struk transfer). Keep in mind it's in IDR (Rupiah). Extract the amount as an integer and output it in 'totalSetoran' field of the JSON. If not found or if the document is not a receipt, return 0.",
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              totalSetoran: {
                type: Type.INTEGER,
                description: "The total deposit or payment amount in IDR as a clean integer. 0 if not found.",
              },
            },
            required: ["totalSetoran"],
          },
        },
      });

      const jsonStr = response.text || "{}";
      const result = JSON.parse(jsonStr.trim());
      return res.json(result);
    } catch (error: any) {
      console.error("Gemini Extraction Error:", error);
      let errMsg = error.message || "";
      if (typeof errMsg !== "string") {
        errMsg = JSON.stringify(errMsg);
      }
      if (
        errMsg.includes("API_KEY_INVALID") || 
        errMsg.includes("API key not valid") || 
        errMsg.includes("INVALID_ARGUMENT") || 
        errMsg.includes("key") ||
        errMsg.includes("API_KEY")
      ) {
        return res.status(400).json({ 
          error: "Kunci API Gemini (GEMINI_API_KEY) tidak valid atau belum diatur. Silakan atur kunci API Anda melalui menu Settings (ikon gerigi di pojok kanan bawah) -> Secrets di Google AI Studio agar pembacaan otomatis dapat berfungsi." 
        });
      }
      return res.status(500).json({ error: errMsg || "Gagal mengekstrak total setoran dari bukti." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const key = process.env.GEMINI_API_KEY;
    const maskedKey = key 
      ? (key === "MY_GEMINI_API_KEY" ? "DEFAULT_PLACEHOLDER" : `${key.substring(0, 5)}... (len: ${key.length})`) 
      : "UNDEFINED";
    console.log(`Server running on port ${PORT}`);
    console.log(`GEMINI_API_KEY status: ${maskedKey}`);
  });
}

startServer();
