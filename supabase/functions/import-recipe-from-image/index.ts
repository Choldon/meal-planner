// Supabase Edge Function for Image-Based Recipe Import
// This function accepts an image and uses OpenAI Vision API to extract structured recipe data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    // Get the image data from the request
    const { imageBase64, images } = await req.json()

    // Support both old format (single image) and new format (multiple images)
    let imageArray = []
    if (images && Array.isArray(images)) {
      imageArray = images
    } else if (imageBase64) {
      // Backward compatibility - single image
      imageArray = [{ data: imageBase64, type: 'image/jpeg', name: 'image' }]
    } else {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${imageArray.length} recipe image(s)...`)

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare the enhanced prompt for OpenAI Vision
    const isMultiPage = imageArray.length > 1
    const prompt = isMultiPage
      ? `Analyze these ${imageArray.length} images which together contain ONE complete recipe. The images may be:
- Multiple pages of the same recipe from a cookbook or PDF
- Front and back of a recipe card
- Multiple photos of different sections of the same recipe
- Sequential pages that need to be combined

IMPORTANT: Combine ALL information from ALL images into a SINGLE cohesive recipe. Don't create separate recipes.

The images may contain:
- A meal kit recipe card (Gusto, HelloFresh, Gousto, etc.)
- A cookbook page or magazine clipping
- A handwritten recipe
- A screenshot from a website or social media
- Any other recipe format

IMPORTANT: Adapt your extraction to whatever format you see. Don't force assumptions.

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

EXTRACTION GUIDELINES:

For ALL recipe types:
- Extract quantities as numbers (convert fractions: 1/2 = 0.5, 1/4 = 0.25, 1/3 = 0.33, etc.)
- Use standard units (g, ml, tbsp, tsp, cup, etc.)
- Separate ingredient name from quantity/unit
- Method steps should be clear and concise
- Infer diet type from ingredients
- Add relevant tags (e.g., "quick", "healthy", "budget-friendly")

Additional context for MEAL KIT CARDS (if applicable):
- Recipe cards typically show title prominently at top
- Ingredients are pre-portioned with exact quantities
- Usually serves 2 people (use shown servings if different)
- Steps are numbered and concise
- Time and difficulty are clearly marked
- May show "1 pack" or "1 sachet" - convert to standard measurements:
  * "1 pack curry paste" → 1 tbsp
  * "1 sachet spice mix" → 1 tsp
  * "1 pack fresh herbs" → 10 g
- Look for ingredient list (often left side or top section)
- Look for numbered steps (often right side or bottom section)

Additional context for COOKBOOK/WEBSITE recipes:
- May have longer, more detailed ingredient lists
- Steps may be more descriptive
- Servings can vary widely
- May include nutritional information

Additional context for HANDWRITTEN recipes:
- Handwriting may be unclear - make best effort
- Measurements may be informal ("pinch", "handful") - convert to standard units
- Steps may be brief - expand if needed for clarity

If times are not visible, estimate based on recipe complexity:
- Simple recipes (salads, sandwiches): 10-15 mins prep, 0-10 mins cook
- Medium recipes (pasta, stir-fry): 15-20 mins prep, 15-25 mins cook
- Complex recipes (roasts, bakes): 20-30 mins prep, 30-60 mins cook

MULTI-PAGE COMBINATION RULES:
- Merge all ingredients from all pages into one complete list
- Combine all method steps in the correct order
- Use the most complete information available across all images
- If times/servings differ, use the most specific or recent value
- Preserve all unique information from each page

Return ONLY the JSON object, no markdown code blocks or extra text.`
      : `Analyze this image and extract recipe information. The image may be:
- A meal kit recipe card (Gusto, HelloFresh, Gousto, etc.)
- A cookbook page or magazine clipping
- A handwritten recipe
- A screenshot from a website or social media
- Any other recipe format

IMPORTANT: Adapt your extraction to whatever format you see. Don't force assumptions.

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

EXTRACTION GUIDELINES:

For ALL recipe types:
- Extract quantities as numbers (convert fractions: 1/2 = 0.5, 1/4 = 0.25, 1/3 = 0.33, etc.)
- Use standard units (g, ml, tbsp, tsp, cup, etc.)
- Separate ingredient name from quantity/unit
- Method steps should be clear and concise
- Infer diet type from ingredients
- Add relevant tags (e.g., "quick", "healthy", "budget-friendly")

Additional context for MEAL KIT CARDS (if applicable):
- Recipe cards typically show title prominently at top
- Ingredients are pre-portioned with exact quantities
- Usually serves 2 people (use shown servings if different)
- Steps are numbered and concise
- Time and difficulty are clearly marked
- May show "1 pack" or "1 sachet" - convert to standard measurements:
  * "1 pack curry paste" → 1 tbsp
  * "1 sachet spice mix" → 1 tsp
  * "1 pack fresh herbs" → 10 g
- Look for ingredient list (often left side or top section)
- Look for numbered steps (often right side or bottom section)

Additional context for COOKBOOK/WEBSITE recipes:
- May have longer, more detailed ingredient lists
- Steps may be more descriptive
- Servings can vary widely
- May include nutritional information

Additional context for HANDWRITTEN recipes:
- Handwriting may be unclear - make best effort
- Measurements may be informal ("pinch", "handful") - convert to standard units
- Steps may be brief - expand if needed for clarity

If times are not visible, estimate based on recipe complexity:
- Simple recipes (salads, sandwiches): 10-15 mins prep, 0-10 mins cook
- Medium recipes (pasta, stir-fry): 15-20 mins prep, 15-25 mins cook
- Complex recipes (roasts, bakes): 20-30 mins prep, 30-60 mins cook

${isMultiPage ? `

MULTI-PAGE COMBINATION RULES:
- Merge all ingredients from all pages into one complete list
- Combine all method steps in the correct order
- Use the most complete information available across all images
- If times/servings differ, use the most specific or recent value
- Preserve all unique information from each page

` : ''}
Return ONLY the JSON object, no markdown code blocks or extra text.`

    console.log('Calling OpenAI Vision API...')

    // Build the content array with text prompt and all images
    const messageContent = [
      {
        type: 'text',
        text: prompt
      }
    ]

    // Add all images to the message
    for (let i = 0; i < imageArray.length; i++) {
      const img = imageArray[i]
      const mimeType = img.type || 'image/jpeg'
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${img.data}`,
          detail: 'high' // Use high detail for better text extraction
        }
      })
    }

    // Call OpenAI Vision API
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
            content: isMultiPage
              ? 'You are a recipe extraction expert. Analyze multiple recipe images and combine them into ONE complete recipe. Return ONLY valid JSON with no additional text or formatting.'
              : 'You are a recipe extraction expert. Analyze recipe images and return ONLY valid JSON with no additional text or formatting.'
          },
          {
            role: 'user',
            content: messageContent
          }
        ],
        temperature: 0.3,
        max_tokens: 3000, // Increased for multi-page recipes
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to process image with OpenAI Vision' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    console.log('OpenAI Vision response received')

    // Extract the recipe data from OpenAI response
    let recipeText = openaiData.choices[0]?.message?.content?.trim()
    
    if (!recipeText) {
      return new Response(
        JSON.stringify({ error: 'No recipe data extracted from image' }),
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
        JSON.stringify({ error: 'Failed to parse recipe data from image', details: recipeText }),
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
    recipeData.sourceType = 'image'
    recipeData.importedAt = new Date().toISOString()

    // Calculate token usage for cost tracking
    const usage = openaiData.usage
    const estimatedCost = (usage.prompt_tokens * 0.00015 / 1000) + (usage.completion_tokens * 0.0006 / 1000)

    console.log(`Recipe extracted successfully from ${imageArray.length} image(s):`, recipeData.title)
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
    console.error('Error in import-recipe-from-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})