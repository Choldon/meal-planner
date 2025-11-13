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
    const { ingredientName } = await req.json()

    if (!ingredientName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ingredient name is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Call OpenAI API to categorize the ingredient
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a helpful assistant that categorizes grocery ingredients into storage categories.
            
Available categories:
- "Fruit & Veg": Fresh fruits and vegetables
- "Fridge": Items that need refrigeration (dairy, meat, fish, fresh herbs, etc.)
- "Cupboard": Dry goods, canned items, oils, spices, condiments that don't need refrigeration
- "Frozen": Items typically stored in the freezer
- "Refill": Household items like cleaning products, toiletries, paper goods
- "Other": Anything that doesn't fit the above categories

Respond with ONLY the category name, nothing else.`
          },
          {
            role: 'user',
            content: `Categorize this ingredient: ${ingredientName}`
          }
        ],
        temperature: 0.3,
        max_tokens: 20
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const category = data.choices[0].message.content.trim()

    // Validate category
    const validCategories = ['Fruit & Veg', 'Fridge', 'Cupboard', 'Frozen', 'Refill', 'Other']
    const finalCategory = validCategories.includes(category) ? category : 'Other'

    // Calculate cost
    const promptTokens = data.usage.prompt_tokens
    const completionTokens = data.usage.completion_tokens
    const inputCost = (promptTokens / 1000000) * 0.150  // $0.150 per 1M input tokens
    const outputCost = (completionTokens / 1000000) * 0.600  // $0.600 per 1M output tokens
    const totalCost = inputCost + outputCost

    return new Response(
      JSON.stringify({
        success: true,
        category: finalCategory,
        metadata: {
          model: 'gpt-4o-mini',
          tokensUsed: promptTokens + completionTokens,
          estimatedCost: totalCost
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})