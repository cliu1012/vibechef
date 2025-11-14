import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedRecipe {
  title: string;
  description: string;
  servings: number;
  ingredients: string[];
  directions: string[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  sourceSlug: string;
  sourceUrl: string;
}

/**
 * Parse MyPlate recipe HTML to extract structured recipe data
 * Looks for specific headings and content sections
 */
function parseMyPlateRecipe(html: string, url: string): ParsedRecipe {
  console.log('Parsing MyPlate recipe from:', url);
  
  // Extract title - look for h1 or article title
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled Recipe';
  
  // Extract description - usually in a paragraph after title
  const descMatch = html.match(/<p[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/p>/i) ||
                    html.match(/<div[^>]*class="[^"]*summary[^"]*"[^>]*>.*?<p>(.*?)<\/p>/is);
  const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
  
  // Extract servings - look for "Makes: X servings" pattern
  const servingsMatch = html.match(/Makes:?\s*(\d+)\s*servings?/i) ||
                       html.match(/Serves:?\s*(\d+)/i) ||
                       html.match(/Yield:?\s*(\d+)/i);
  const servings = servingsMatch ? parseInt(servingsMatch[1]) : 4;
  
  // Extract prep/cook times
  const prepMatch = html.match(/Prep(?:aration)?\s*Time:?\s*(\d+)\s*(?:min|minutes)/i);
  const cookMatch = html.match(/Cook(?:ing)?\s*Time:?\s*(\d+)\s*(?:min|minutes)/i);
  const totalMatch = html.match(/Total\s*Time:?\s*(\d+)\s*(?:min|minutes)/i);
  
  const prepTime = prepMatch ? parseInt(prepMatch[1]) : undefined;
  const cookTime = cookMatch ? parseInt(cookMatch[1]) : undefined;
  const totalTime = totalMatch ? parseInt(totalMatch[1]) : undefined;
  
  // Extract ingredients - look for ul/ol after "Ingredients" heading
  const ingredientsSection = html.match(/<h[2-4][^>]*>Ingredients<\/h[2-4]>(.*?)(?=<h[2-4]|$)/is);
  const ingredients: string[] = [];
  
  if (ingredientsSection) {
    const listItems = ingredientsSection[1].matchAll(/<li[^>]*>(.*?)<\/li>/gs);
    for (const item of listItems) {
      const text = item[1].replace(/<[^>]*>/g, '').trim();
      if (text) ingredients.push(text);
    }
  }
  
  // Extract directions - look for ol/ul after "Directions" or "Instructions" heading
  const directionsSection = html.match(/<h[2-4][^>]*>(?:Directions|Instructions|Steps)<\/h[2-4]>(.*?)(?=<h[2-4]|$)/is);
  const directions: string[] = [];
  
  if (directionsSection) {
    const listItems = directionsSection[1].matchAll(/<li[^>]*>(.*?)<\/li>/gs);
    for (const item of listItems) {
      const text = item[1].replace(/<[^>]*>/g, '').trim();
      if (text) directions.push(text);
    }
  }
  
  // Extract slug from URL
  const urlParts = url.split('/');
  const sourceSlug = urlParts[urlParts.length - 1] || 'unknown';
  
  console.log(`Parsed recipe: ${title}, ${ingredients.length} ingredients, ${directions.length} steps`);
  
  return {
    title,
    description,
    servings,
    ingredients,
    directions,
    prepTime,
    cookTime,
    totalTime,
    sourceSlug,
    sourceUrl: url,
  };
}

/**
 * Insert parsed recipe into Supabase tables
 */
async function insertMyPlateRecipe(supabase: any, parsed: ParsedRecipe, userId: string) {
  console.log('Inserting recipe:', parsed.title);
  
  // Insert main recipe record
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      title: parsed.title,
      description: parsed.description,
      servings: parsed.servings,
      steps: parsed.directions,
      prep_time_minutes: parsed.prepTime,
      cook_time_minutes: parsed.cookTime,
      total_time_minutes: parsed.totalTime,
      source: 'myplate',
      source_recipe_slug: parsed.sourceSlug,
      source_url: parsed.sourceUrl,
    })
    .select()
    .single();
  
  if (recipeError) {
    console.error('Error inserting recipe:', recipeError);
    throw new Error(`Failed to insert recipe: ${recipeError.message}`);
  }
  
  console.log('Recipe inserted with id:', recipe.id);
  
  // Insert ingredients
  if (parsed.ingredients.length > 0) {
    const ingredientRows = parsed.ingredients.map(ing => ({
      recipe_id: recipe.id,
      raw_text: ing,
    }));
    
    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientRows);
    
    if (ingredientsError) {
      console.error('Error inserting ingredients:', ingredientsError);
      // Don't throw - recipe was created successfully
    } else {
      console.log(`Inserted ${parsed.ingredients.length} ingredients`);
    }
  }
  
  // Add some basic tags based on recipe content
  const tags: string[] = [];
  const titleLower = parsed.title.toLowerCase();
  
  if (titleLower.includes('chicken')) tags.push('chicken');
  if (titleLower.includes('beef')) tags.push('beef');
  if (titleLower.includes('fish') || titleLower.includes('salmon') || titleLower.includes('tuna')) tags.push('fish');
  if (titleLower.includes('vegetarian') || titleLower.includes('veggie')) tags.push('vegetarian');
  if (titleLower.includes('salad')) tags.push('salad');
  if (titleLower.includes('soup')) tags.push('soup');
  if (parsed.totalTime && parsed.totalTime <= 30) tags.push('quick');
  
  if (tags.length > 0) {
    const tagRows = tags.map(tag => ({
      recipe_id: recipe.id,
      tag,
    }));
    
    const { error: tagsError } = await supabase
      .from('recipe_tags')
      .insert(tagRows);
    
    if (tagsError) {
      console.error('Error inserting tags:', tagsError);
    } else {
      console.log(`Inserted ${tags.length} tags`);
    }
  }
  
  return recipe;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse request body
    const { url } = await req.json();
    
    // Validate URL
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!url.startsWith('https://www.myplate.gov/recipes/')) {
      return new Response(
        JSON.stringify({ error: 'URL must be from myplate.gov/recipes/' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Fetching MyPlate recipe from:', url);
    
    // Fetch the recipe page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch recipe: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Parse the HTML
    const parsed = parseMyPlateRecipe(html, url);
    
    if (!parsed.title || parsed.ingredients.length === 0 || parsed.directions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse recipe. Could not extract title, ingredients, or directions.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Insert into database
    const recipe = await insertMyPlateRecipe(supabase, parsed, user.id);
    
    return new Response(
      JSON.stringify({ success: true, recipe }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in import-myplate-recipe:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
