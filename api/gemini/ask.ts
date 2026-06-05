/**
 * Vercel Serverless Function for SCCA AI Assistant
 * This replaces the Express endpoint for production deployment
 */

import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'nodejs',
};

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface RequestBody {
  prompt: string;
  chatHistory?: ChatMessage[];
}

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, chatHistory } = req.body as RequestBody;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return res.status(200).json({
        text: `⚠️ **SCCA AI Assistant Setup Required**
        
The SCCA AI Assistant is ready! To start chatting, please add your **GEMINI_API_KEY** in the **Settings > Vars** panel in the top-right of your screen. This key is securely handled by our server proxy to keep your credentials safe from the browser.

Meanwhile, let me share a default advice context:

* **Fluid Hydration Target**: Adults with SS or SC genotype require at least 3.5 to 4 Liters of room-temperature fluids daily to avoid plasma viscosity spikes.
* **Maintenance Pharmacotherapy**: Consistent Hydroxyurea therapy increases HbF (fetal hemoglobin) concentrations, reducing active vaso-occlusion occurrences.
* **disclaimer**: This guidance does not substitute professional clinical advice.`
      });
    }

    // Initialize Google GenAI SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `You are the SCCA AI Assistant, an elite medical educator for Sickle Cell Disease (SCD) in Africa. Your task is to provide supportive, scientifically pristine, and highly specialized text answers.
Rules:
1. Provide accurate answers to common sickle cell questions, explain red blood cell shape, blood flow mechanisms, genetics (SS, SC, CC, AS, AC, AA), hemoglobin S polymerization, and sickle-cell traits.
2. Explain medication mechanisms (such as Hydroxyurea increasing fetal hemoglobin HbF, prophylactic penicillin preventing pneumococcal infections, folic acid supporting erythropoiesis, and pain relievers).
3. Provide educational guidelines, explain pain crisis triggers (exhaustion, physical stress, cold, dehydration).
4. Outline symptoms clearly (vaso-occlusive crises, acute chest syndrome, dactylitis, splenic sequestration, chronic anemia).
5. Suggest relevant, specific questions patients can ask their clinic hematologists or medical specialist.
6. **PROHIBITION**: Never state you represent a full doctor. You MUST ALWAYS append this exact warning structure at the bottom:
   > 🔴 **Medical Disclaimer**: AI Guidance is for educational information only and does NOT substitute direct clinical diagnosis. For any treatment changes, always consult with your primary hematologist at your local SCCA-certified hospital unit. Do not modify Hydroxyurea dosages on your own.
7. Craft readable responses with bullet points and bolding, using compassionate language that respects African community context. Avoid clinical jargon without explaining it first.`;

    // Build chat history context
    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Append current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || 'I checked my knowledge base but couldn\'t generate a reply. Please try restating your query.';
    res.json({ text: replyText });

  } catch (e: any) {
    console.error('Error contacting Gemini service:', e);
    res.status(500).json({ error: e.message || 'System error connecting to Gemini AI. Please check configuration.' });
  }
}
