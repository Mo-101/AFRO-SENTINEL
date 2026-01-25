import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language code to name mapping for African languages
const AFRICAN_LANGUAGES: Record<string, string> = {
  'sw': 'Swahili',
  'ha': 'Hausa',
  'yo': 'Yoruba',
  'ig': 'Igbo',
  'am': 'Amharic',
  'om': 'Oromo',
  'so': 'Somali',
  'zu': 'Zulu',
  'xh': 'Xhosa',
  'rw': 'Kinyarwanda',
  'sn': 'Shona',
  'wo': 'Wolof',
  'ff': 'Fulfulde',
  'ln': 'Lingala',
  'kg': 'Kikongo',
  'ti': 'Tigrinya',
  'tw': 'Twi',
  'ak': 'Akan',
  'mg': 'Malagasy',
  'ny': 'Chichewa',
  'ar': 'Arabic',
  'fr': 'French',
  'pt': 'Portuguese',
  'en': 'English',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage = 'en' } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI for translation and language detection
    const systemPrompt = `You are an expert translator specializing in African languages. 
Given the following text, perform these tasks:
1. Detect the source language (provide ISO 639-1 code if possible)
2. Identify the script used (latin, arabic, ge_ez, nko, or other)
3. Translate the text to ${targetLanguage}
4. Rate your translation confidence (0-100)
5. Calculate a "Lingua Fidelity" score (0-100) - how well the translation preserves the original meaning, cultural context, and local expressions

Respond ONLY with valid JSON in this exact format:
{
  "detected_language": "language code",
  "language_name": "full name",
  "script": "script type",
  "translation": "translated text",
  "translation_confidence": number,
  "lingua_fidelity_score": number,
  "cultural_notes": "any important cultural context"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Translation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse the JSON response
    let result;
    try {
      // Clean up potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse translation response:', content);
      // Return a basic response if parsing fails
      result = {
        detected_language: 'unknown',
        language_name: 'Unknown',
        script: 'unknown',
        translation: text, // Return original if translation fails
        translation_confidence: 0,
        lingua_fidelity_score: 0,
        cultural_notes: 'Translation parsing failed'
      };
    }

    // Enrich with language metadata
    if (result.detected_language && AFRICAN_LANGUAGES[result.detected_language]) {
      result.language_name = AFRICAN_LANGUAGES[result.detected_language];
      result.is_african_language = true;
    }

    // Mark as "LOCAL VOICE" if it's an African language matching the region
    result.local_voice = result.is_african_language || false;

    return new Response(
      JSON.stringify({
        success: true,
        original_text: text,
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('translate-text error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
