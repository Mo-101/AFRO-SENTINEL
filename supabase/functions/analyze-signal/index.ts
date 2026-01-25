import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting state (in-memory for single instance)
const rateLimitState = {
  requests: 0,
  resetTime: Date.now() + 60000,
  maxRequests: 100, // Max 100 requests per minute
};

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now > rateLimitState.resetTime) {
    rateLimitState.requests = 0;
    rateLimitState.resetTime = now + 60000;
  }
  
  if (rateLimitState.requests >= rateLimitState.maxRequests) {
    return false;
  }
  
  rateLimitState.requests++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check rate limit
    if (!checkRateLimit()) {
      console.log('Rate limit exceeded, falling back to Lovable AI');
      // Fall back to Lovable AI
      return await useLovableAI(req);
    }

    const { text, analysisType = 'classify' } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Azure OpenAI credentials
    const endpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const apiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    const deployment = Deno.env.get('AZURE_OPENAI_DEPLOYMENT');
    const apiVersion = Deno.env.get('AZURE_OPENAI_API_VERSION') || '2024-12-01-preview';

    if (!endpoint || !apiKey || !deployment) {
      console.log('Azure OpenAI not configured, falling back to Lovable AI');
      return await useLovableAI(req);
    }

    // Build the prompt based on analysis type
    let systemPrompt = '';
    
    if (analysisType === 'classify') {
      systemPrompt = `You are an expert epidemiologist and disease surveillance analyst. Analyze the following text from Africa and extract:
1. Disease name (if identifiable)
2. Disease category (vhf, respiratory, enteric, vector_borne, zoonotic, vaccine_preventable, environmental, unknown)
3. Priority level (P1-Critical, P2-High, P3-Medium, P4-Low)
4. Confidence score (0-100)
5. Key symptoms mentioned
6. Location details if mentioned
7. Whether this matches seasonal patterns

Respond in JSON format only.`;
    } else if (analysisType === 'validate') {
      systemPrompt = `You are an expert at validating disease outbreak reports. Assess the credibility and severity of this report:
1. Plausibility score (0-100)
2. Red flags or inconsistencies
3. Suggested cross-references
4. Recommended priority adjustment

Respond in JSON format only.`;
    }

    const azureUrl = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', response.status, errorText);
      
      // Fall back to Lovable AI on Azure errors
      if (response.status === 429 || response.status >= 500) {
        console.log('Azure error, falling back to Lovable AI');
        return await useLovableAI(req);
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Try to parse as JSON
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { raw_response: content };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        model: 'azure-openai',
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('analyze-signal error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fallback function using Lovable AI
async function useLovableAI(req: Request): Promise<Response> {
  try {
    const { text, analysisType = 'classify' } = await req.json().catch(() => ({ text: '', analysisType: 'classify' }));
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'No AI service configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = '';
    if (analysisType === 'classify') {
      systemPrompt = `You are an expert epidemiologist. Analyze this text from Africa and return JSON with: disease_name, category (vhf/respiratory/enteric/vector_borne/zoonotic/vaccine_preventable/environmental/unknown), priority (P1/P2/P3/P4), confidence (0-100), symptoms[], location.`;
    } else {
      systemPrompt = `Validate this disease report. Return JSON with: plausibility (0-100), red_flags[], suggested_priority.`;
    }

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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: 'Lovable AI error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { raw_response: content };
    }

    return new Response(
      JSON.stringify({ success: true, analysis, model: 'lovable-ai' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Fallback failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
