exports.handler = async (event) => {

  /* ── Allow browser preflight requests ── */
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {

    /* ── 1. Read API key from Netlify environment variables ── */
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in Netlify environment variables');
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: 'GEMINI_API_KEY is not configured. Go to Netlify → Site configuration → Environment variables and add GEMINI_API_KEY.'
          }
        })
      };
    }

    /* ── 2. Parse the request body ── */
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseErr) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: { message: 'Invalid JSON in request body' } })
      };
    }

    /* ── 3. Call Google Gemini API ── */
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: body.contents,
        systemInstruction: body.systemInstruction
      })
    });

    const responseText = await geminiResponse.text();

    /* ── 4. Return whatever Gemini returned ── */
    return {
      statusCode: geminiResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: responseText
    };

  } catch (err) {
    console.error('gemini-proxy error:', err.message);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: err.message } })
    };
  }

};
