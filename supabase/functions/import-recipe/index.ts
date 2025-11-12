// Supabase Edge Function for Recipe Import
// This function fetches a recipe webpage and uses OpenAI to extract structured recipe data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the recipe URL from the request
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Recipe URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate URL
    let recipeUrl: URL
    try {
      recipeUrl = new URL(url)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching recipe from:', recipeUrl.href)

    // Fetch the webpage content
    const webpageResponse = await fetch(recipeUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!webpageResponse.ok) {
      const statusCode = webpageResponse.status
      let errorMessage = `Failed to fetch webpage (${statusCode})`
      
      if (statusCode === 404) {
        errorMessage = 'Recipe page not found. The URL may be incorrect or the page may have been removed.'
      } else if (statusCode === 403) {
        errorMessage = 'Access denied. The website may be blocking automated requests.'
      } else if (statusCode >= 500) {
        errorMessage = 'The recipe website is currently unavailable. Please try again later.'
      }
      
      console.error('Webpage fetch failed:', statusCode, webpageResponse.statusText)
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = await webpageResponse.text()
    console.log('Fetched HTML, length:', html.length)

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare the prompt for OpenAI
    const prompt = `Extract recipe information from this HTML and return ONLY a valid JSON object with no additional text or markdown formatting.

The JSON must have this exact structure:
{
  "title": "Recipe name",
  "servings": number,
  "prepTime": number (in minutes),
  "cookTime": number (in minutes),
  "ingredients": [
    {"quantity": number, "unit": "string", "name": "ingredient name"}
  ],
  "method": ["step 1", "step 2"],
  "diet": "Vegetarian" | "Vegan" | "Non-Vegetarian" | "Pescatarian",
  "cuisine": "Italian" | "Chinese" | "Indian" | "Mexican" | "British" | "Thai" | "Mediterranean" | "American" | "Other",
  "difficulty": "Easy" | "Medium" | "Hard",
  "tags": ["tag1", "tag2"]
}

Rules:
- Extract quantities as numbers (convert fractions: 1/2 = 0.5, 1/4 = 0.25, etc.)
- Use standard units (g, ml, tbsp, tsp, cup, etc.)
- Separate ingredient name from quantity/unit
- Method steps should be clear and concise
- Infer diet type from ingredients
- Add relevant tags (e.g., "quick", "healthy", "budget-friendly")
- Return ONLY the JSON object, no markdown code blocks or extra text

HTML:
${html.substring(0, 15000)}`

    console.log('Calling OpenAI API...')

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a recipe extraction expert. Extract recipe data from HTML and return ONLY valid JSON with no additional text or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to process recipe with OpenAI' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    console.log('OpenAI response received')

    // Extract the recipe data from OpenAI response
    let recipeText = openaiData.choices[0]?.message?.content?.trim()
    
    if (!recipeText) {
      return new Response(
        JSON.stringify({ error: 'No recipe data extracted' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Remove markdown code blocks if present
    recipeText = recipeText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Parse the JSON
    let recipeData
    try {
      recipeData = JSON.parse(recipeText)
    } catch (parseError) {
      console.error('Failed to parse recipe JSON:', parseError)
      console.error('Raw response:', recipeText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse recipe data', details: recipeText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    const requiredFields = ['title', 'servings', 'prepTime', 'cookTime', 'ingredients', 'method']
    for (const field of requiredFields) {
      if (!recipeData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Add metadata
    recipeData.sourceUrl = recipeUrl.href
    recipeData.importedAt = new Date().toISOString()

    // Calculate token usage for cost tracking
    const usage = openaiData.usage
    const estimatedCost = (usage.prompt_tokens * 0.00015 / 1000) + (usage.completion_tokens * 0.0006 / 1000)

    console.log('Recipe extracted successfully:', recipeData.title)
    console.log('Token usage:', usage)
    console.log('Estimated cost: $', estimatedCost.toFixed(6))

    // Return the extracted recipe data
    return new Response(
      JSON.stringify({
        success: true,
        recipe: recipeData,
        metadata: {
          tokensUsed: usage.total_tokens,
          estimatedCost: estimatedCost,
          model: 'gpt-4o-mini'
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in import-recipe function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})