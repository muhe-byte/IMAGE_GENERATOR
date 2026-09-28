import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
  }
}

// 1. Cinematographer AI Assistant endpoint
app.post('/api/cinematographer-assist', async (req: Request, res: Response) => {
  try {
    const { actionDescription, genre, visualStyle, characters, location, mood } = req.body;
    
    if (!ai) {
      // Fallback rule-based cinematic recommendation if API key isn't active
      return res.json({
        recommendation: generateCinematicRecommendationRuleBased({
          actionDescription, genre, visualStyle, characters, location, mood
        }),
      });
    }

    const prompt = `You are an elite, award-winning Director of Photography and Virtual Cinematographer for a feature film.
Given the following scene parameters:
- Action/Narrative: "${actionDescription || 'A quiet, tense moment'}"
- Genre: "${genre || 'Contemporary Drama'}"
- Visual Style: "${visualStyle || 'Photorealistic 35mm naturalistic cinema'}"
- Characters Present: ${JSON.stringify(characters || [])}
- Location: "${location?.name || 'Interior Room'}" (${location?.description || ''})
- Scene Mood/Emotion: "${mood || 'Tension'}"

Recommend the exact cinematography, lighting, and composition setup to capture maximum emotional and storytelling impact while maintaining photorealistic feature-film continuity.
Respond in strict JSON with the following structure:
{
  "shotType": "string (e.g. Medium Close-Up, Wide Shot, Close-Up, Two Shot, Extreme Close-Up, Over-the-Shoulder, POV)",
  "cameraAngle": "string (e.g. Eye level, Low angle, High angle, Dutch angle)",
  "cameraMovement": "string (e.g. Static, Tracking composition, Push-in composition, Handheld)",
  "lens": "string (e.g. 35mm, 50mm, 85mm, 24mm)",
  "depthOfField": "string (e.g. Shallow depth, Deep focus, Moderate depth)",
  "focusTarget": "string (e.g. Character eyes, Hero object, Foreground)",
  "lightingPreset": "string (e.g. Soft window light, Low-key cinematic, Golden hour rim, Dramatic side lighting)",
  "keyLightDirection": "string (e.g. Camera Left 45°, Camera Right 45°, Back-rim)",
  "contrastRatio": "string (e.g. Moderate 4:1, High 8:1, Low 2:1)",
  "colorTemperature": "string (e.g. 3200K Warm Tungsten, 5600K Daylight, 4200K Muted)",
  "compositionDescription": "string (detailed description of subject placement, negative space, framing)",
  "continuityNotes": "string (critical elements to keep locked such as lighting angle, wardrobe, props)",
  "whyTheseChoices": "string (clear 2-3 sentence directorial rationale explaining the emotional reasoning)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ recommendation: parsed });
  } catch (error: any) {
    console.warn('Cinematographer assist fallback triggered:', error.message);
    const fallback = generateCinematicRecommendationRuleBased(req.body);
    return res.json({ recommendation: fallback });
  }
});

// 2. Intelligent Prompt Synthesis endpoint
app.post('/api/synthesize-prompt', async (req: Request, res: Response) => {
  try {
    const { scene, project, characters, location, props } = req.body;
    
    // Build a structured cinematic prompt
    const charDesc = characters?.map((c: any) => 
      `${c.name} (${c.gender || ''}, ${c.age || ''}yo, ${c.ethnicity || ''}, ${c.hair || ''}, wearing ${c.clothing || 'default wardrobe'})`
    ).join(', ') || 'Character';

    const locDesc = location ? `${location.name} (${location.description || ''}, ${location.architecture || ''})` : 'Cinematic environment';
    const propDesc = props?.length ? `Props in frame: ${props.map((p: any) => p.name).join(', ')}.` : '';

    const positivePrompt = `A 35mm feature-film still, captured on ARRI Alexa LF with Master Prime lenses.
[SCENE] ${scene?.description || 'Cinematic scene'}
[CHARACTERS & WARDROBE] ${charDesc}. Consistent facial features, natural pores, authentic skin texture, realistic human eyes.
[LOCATION] ${locDesc}. Consistent architecture, authentic physical materials, natural depth.
${propDesc}
[CINEMATOGRAPHY] Shot: ${scene?.cinematography?.shotType || 'Medium Shot'}, Angle: ${scene?.cinematography?.cameraAngle || 'Eye level'}, Lens: ${scene?.cinematography?.lens || '50mm'}, Depth of Field: ${scene?.cinematography?.depthOfField || 'Shallow depth of field with natural anamorphic bokeh'}, Composition: ${scene?.cinematography?.cameraMovement || 'Static cinematic composition'}.
[LIGHTING & COLOR] ${scene?.lighting?.preset || 'Naturalistic cinematic lighting'}, Key Light: ${scene?.lighting?.keyLightDirection || 'Camera Left 45°'}, Contrast: ${scene?.lighting?.contrastRatio || 'Moderate 4:1'}, Color Temp: ${scene?.lighting?.colorTemperature || '5600K Daylight'}, Palette: ${project?.visualDNA?.colorLanguage || 'Muted naturalistic grading'}.
[MOOD & REALISM] ${scene?.emotion || 'Tense and quiet'}. Photorealistic feature film cinematography, subtle Kodak Vision3 film grain, true optical physics, no artificial beauty filters.`;

    const negativePrompt = `distorted anatomy, extra fingers, malformed hands, deformed eyes, artificial plastic skin, airbrushed, cartoonish, 3d render look, oversaturated neon, excessive HDR, videogame graphics, blurry, double heads, inconsistent facial features, random wardrobe alteration, watermark, signature, camera UI, logos, subtitles.`;

    const explanation = `Shot with a ${scene?.cinematography?.lens || '50mm'} lens at ${scene?.cinematography?.cameraAngle || 'Eye level'} to keep perspective intimate and naturalistic. Motivated ${scene?.lighting?.preset || 'natural'} lighting maintains physical realism for ${location?.name || 'the scene'} while preserving emotional subtext.`;

    return res.json({
      prompt: positivePrompt,
      negativePrompt,
      explanation,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 3. Image Generation endpoint
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio, referenceImages, negativePrompt, count = 1 } = req.body;
    
    // Validate aspect ratio
    const validRatios = ['16:9', '1:1', '4:3', '3:4', '9:16'];
    const chosenRatio = validRatios.includes(aspectRatio) ? aspectRatio : '16:9';

    // If Google GenAI client is available, try real image generation
    if (ai) {
      try {
        const parts: any[] = [{ text: prompt }];

        // Attach reference images if provided (base64 inlineData)
        if (Array.isArray(referenceImages) && referenceImages.length > 0) {
          for (const ref of referenceImages.slice(0, 3)) {
            if (ref && typeof ref === 'string' && ref.startsWith('data:image/')) {
              const matches = ref.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
              if (matches) {
                parts.push({
                  inlineData: {
                    mimeType: matches[1],
                    data: matches[2],
                  },
                });
              }
            }
          }
        }

        const generatedImages: string[] = [];
        const iterations = Math.min(count, 4); // generate up to count batches

        for (let i = 0; i < iterations; i++) {
          const result = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: chosenRatio as any,
              },
            },
          });

          let foundImage = false;
          if (result.candidates?.[0]?.content?.parts) {
            for (const part of result.candidates[0].content.parts) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                generatedImages.push(`data:${mime};base64,${part.inlineData.data}`);
                foundImage = true;
                break;
              }
            }
          }

          if (!foundImage && i === 0) {
            console.log('No image part in model response, using procedural cinematic generator');
            break;
          }
        }

        if (generatedImages.length > 0) {
          return res.json({
            images: generatedImages,
            provider: 'gemini-3.1-flash-lite-image',
            status: 'success',
          });
        }
      } catch (genError: any) {
        console.warn('GenAI image model call failed, switching to high-fidelity procedural cinema renderer:', genError.message);
      }
    }

    // High fidelity fallback response
    return res.json({
      images: [],
      provider: 'procedural-cinema-engine',
      status: 'fallback-ready',
      message: 'Client-side high-fidelity cinema synthesizer active',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Helper for rule-based recommendation
function generateCinematicRecommendationRuleBased(params: any) {
  const mood = (params.mood || '').toLowerCase();
  const isTense = mood.includes('fear') || mood.includes('shock') || mood.includes('suspicion') || mood.includes('tension');
  const isSad = mood.includes('sad') || mood.includes('grief') || mood.includes('desperation');

  return {
    shotType: isTense ? 'Medium Close-Up' : isSad ? 'Close-Up' : 'Medium Shot',
    cameraAngle: isTense ? 'Slight Low angle' : 'Eye level',
    cameraMovement: isTense ? 'Handheld naturalistic' : 'Static cinematic composition',
    lens: isTense ? '35mm' : isSad ? '85mm' : '50mm',
    depthOfField: isSad ? 'Extremely shallow cinematic depth (f/1.4)' : 'Shallow depth (f/2.8)',
    focusTarget: 'Character eyes',
    lightingPreset: isTense ? 'Dramatic side lighting' : isSad ? 'Soft window light' : 'Natural daylight',
    keyLightDirection: 'Camera Left 45°',
    contrastRatio: isTense ? 'High 8:1' : 'Moderate 4:1',
    colorTemperature: isSad ? '4200K Muted cool' : '5600K Daylight',
    compositionDescription: 'Subject positioned off-center along the right third, with deep negative space emphasizing psychological isolation.',
    continuityNotes: 'Lock costume texture and keep key light angle from window camera-left consistent with previous scene.',
    whyTheseChoices: `${isSad ? 'An 85mm shallow focus isolates the subject from the background to emphasize raw internal grief.' : 'A 35mm naturalistic lens places the viewer intimately inside the character’s physical space.'} Soft motivated side lighting maintains physical realism.`,
  };
}

// Vite integration:
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`CineFrame AI server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
