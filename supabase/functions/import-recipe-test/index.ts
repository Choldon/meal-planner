// Simple test version of import-recipe to diagnose issues
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== TEST FUNCTION STARTED ===')
    
    // Test 1: Can we read the request?
    const { url } = await req.json()
    console.log('Test 1 - Request URL:', url)

    // Test 2: Can we access environment variables?
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    console.log('Test 2 - OpenAI key exists:', !!openaiKey)
    console.log('Test 2 - OpenAI key prefix:', openaiKey ? openaiKey.substring(0, 7) : 'MISSING')

    // Test 3: Can we fetch a webpage?
    console.log('Test 3 - Fetching webpage...')
    const webResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    console.log('Test 3 - Fetch status:', webResponse.status)
    console.log('Test 3 - Fetch ok:', webResponse.ok)
    
    const html = await webResponse.text()
    console.log('Test 3 - HTML length:', html.length)

    // Test 4: Can we call OpenAI?
    console.log('Test 4 - Calling OpenAI...')
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Say "test successful"' }
        ],
        max_tokens: 10,
      }),
    })
    
    console.log('Test 4 - OpenAI status:', openaiResponse.status)
    console.log('Test 4 - OpenAI ok:', openaiResponse.ok)

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('Test 4 - OpenAI error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API failed',
          details: errorText,
          status: openaiResponse.status
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    console.log('Test 4 - OpenAI response:', JSON.stringify(openaiData))

    console.log('=== ALL TESTS PASSED ===')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All tests passed!',
        tests: {
          requestParsing: 'OK',
          environmentVariable: !!openaiKey,
          webpageFetch: webResponse.ok,
          openaiApi: openaiResponse.ok,
          htmlLength: html.length
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('=== ERROR IN TEST FUNCTION ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.constructor.name,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})