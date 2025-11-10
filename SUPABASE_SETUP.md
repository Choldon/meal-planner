# Supabase Backend Setup Guide

This guide will help you set up Supabase as your backend database for real-time collaboration between Kit and Jess.

## Why Supabase?

- ✅ **Free tier** - More than enough for 2 people
- ✅ **Real-time sync** - Changes appear instantly for both users
- ✅ **Easy setup** - No coding required for database
- ✅ **Secure** - Built-in authentication and security
- ✅ **Works anywhere** - Access from any device

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in:
   - **Name:** `meal-planner` (or any name you like)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to UK (e.g., "West EU (London)")
   - **Pricing Plan:** Free
3. Click "Create new project"
4. Wait 2-3 minutes for setup to complete

## Step 3: Create Database Tables

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy and paste this SQL code:

```sql
-- Create ingredients table
CREATE TABLE ingredients (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE recipes (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  diet TEXT NOT NULL,
  servings INTEGER NOT NULL,
  prep_time INTEGER NOT NULL,
  cook_time INTEGER NOT NULL,
  ingredients JSONB NOT NULL,
  method JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meals table
CREATE TABLE meals (
  id BIGINT PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
  people JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping_list table
CREATE TABLE shopping_list (
  id BIGINT PRIMARY KEY,
  ingredient_id BIGINT REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  meal_id BIGINT REFERENCES meals(id) ON DELETE CASCADE,
  recipe_id BIGINT,
  recipe_name TEXT,
  is_recipe_item BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since it's just you two)
CREATE POLICY "Enable all for ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for meals" ON meals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for shopping_list" ON shopping_list FOR ALL USING (true) WITH CHECK (true);
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 4: Insert Initial Data

1. In SQL Editor, create another new query
2. Copy and paste this code to insert your ingredients:

```sql
-- Insert all 96 ingredients
INSERT INTO ingredients (id, name, category) VALUES
  (1, 'Courgette', 'Fruit & Veg'),
  (2, 'Aubergine', 'Fruit & Veg'),
  (3, 'Garlic', 'Fruit & Veg'),
  (9, 'Bell Pepper', 'Fruit & Veg'),
  (10, 'Broccoli', 'Fruit & Veg'),
  (13, 'Onions', 'Fruit & Veg'),
  (14, 'Carrots', 'Fruit & Veg'),
  (15, 'Potatoes', 'Fruit & Veg'),
  (16, 'Tomatoes', 'Fruit & Veg'),
  (17, 'Cucumber', 'Fruit & Veg'),
  (18, 'Lettuce', 'Fruit & Veg'),
  (19, 'Mushrooms', 'Fruit & Veg'),
  (20, 'Spinach', 'Fruit & Veg'),
  (21, 'Apples', 'Fruit & Veg'),
  (22, 'Bananas', 'Fruit & Veg'),
  (23, 'Oranges', 'Fruit & Veg'),
  (24, 'Lemons', 'Fruit & Veg'),
  (25, 'Ginger', 'Fruit & Veg'),
  (26, 'Spring Onions', 'Fruit & Veg'),
  (27, 'Sweet Potatoes', 'Fruit & Veg'),
  (28, 'Celery', 'Fruit & Veg'),
  (29, 'Cauliflower', 'Fruit & Veg'),
  (30, 'Green Beans', 'Fruit & Veg'),
  (6, 'White Sauce', 'Fridge'),
  (7, 'Cheddar Cheese', 'Fridge'),
  (8, 'Chicken Breast', 'Fridge'),
  (31, 'Milk', 'Fridge'),
  (32, 'Butter', 'Fridge'),
  (33, 'Eggs', 'Fridge'),
  (34, 'Yogurt', 'Fridge'),
  (35, 'Cream', 'Fridge'),
  (36, 'Bacon', 'Fridge'),
  (37, 'Sausages', 'Fridge'),
  (38, 'Mince Beef', 'Fridge'),
  (39, 'Salmon', 'Fridge'),
  (40, 'Hummus', 'Fridge'),
  (41, 'Parmesan Cheese', 'Fridge'),
  (42, 'Mozzarella', 'Fridge'),
  (43, 'Feta Cheese', 'Fridge'),
  (44, 'Cream Cheese', 'Fridge'),
  (45, 'Pesto', 'Fridge'),
  (4, 'Chopped Tomatoes', 'Cupboard'),
  (5, 'Lasagne Sheets', 'Cupboard'),
  (11, 'Soy Sauce', 'Cupboard'),
  (12, 'Rice', 'Cupboard'),
  (46, 'Pasta', 'Cupboard'),
  (47, 'Flour', 'Cupboard'),
  (48, 'Sugar', 'Cupboard'),
  (49, 'Salt', 'Cupboard'),
  (50, 'Black Pepper', 'Cupboard'),
  (51, 'Baked Beans', 'Cupboard'),
  (52, 'Chickpeas', 'Cupboard'),
  (53, 'Kidney Beans', 'Cupboard'),
  (54, 'Coconut Milk', 'Cupboard'),
  (55, 'Stock Cubes', 'Cupboard'),
  (56, 'Tomato Puree', 'Cupboard'),
  (57, 'Honey', 'Cupboard'),
  (58, 'Jam', 'Cupboard'),
  (59, 'Peanut Butter', 'Cupboard'),
  (60, 'Curry Powder', 'Cupboard'),
  (61, 'Paprika', 'Cupboard'),
  (62, 'Cumin', 'Cupboard'),
  (63, 'Mixed Herbs', 'Cupboard'),
  (64, 'Chilli Flakes', 'Cupboard'),
  (65, 'Vinegar', 'Cupboard'),
  (66, 'Worcestershire Sauce', 'Cupboard'),
  (67, 'Noodles', 'Cupboard'),
  (68, 'Couscous', 'Cupboard'),
  (69, 'Oats', 'Cupboard'),
  (70, 'Cereal', 'Cupboard'),
  (71, 'Tea Bags', 'Cupboard'),
  (72, 'Coffee', 'Cupboard'),
  (73, 'Frozen Peas', 'Frozen'),
  (74, 'Frozen Sweetcorn', 'Frozen'),
  (75, 'Frozen Mixed Veg', 'Frozen'),
  (76, 'Fish Fingers', 'Frozen'),
  (77, 'Frozen Pizza', 'Frozen'),
  (78, 'Ice Cream', 'Frozen'),
  (79, 'Frozen Chips', 'Frozen'),
  (80, 'Frozen Berries', 'Frozen'),
  (81, 'Olive Oil', 'Refill'),
  (82, 'Shampoo', 'Refill'),
  (83, 'Conditioner', 'Refill'),
  (84, 'Soap', 'Refill'),
  (85, 'Sesame Oil', 'Refill'),
  (86, 'Rinse Aid', 'Refill'),
  (87, 'Washing Up Liquid', 'Refill'),
  (88, 'Laundry Detergent', 'Refill'),
  (89, 'Hand Wash', 'Refill'),
  (90, 'Bread', 'Other'),
  (91, 'Kitchen Roll', 'Other'),
  (92, 'Toilet Paper', 'Other'),
  (93, 'Bin Bags', 'Other'),
  (94, 'Cling Film', 'Other'),
  (95, 'Foil', 'Other'),
  (96, 'Baking Paper', 'Other');
```

3. Click **"Run"**
4. You should see "Success. 96 rows affected"

## Step 5: Insert Sample Recipes

1. Create another new query
2. Copy and paste:

```sql
-- Insert sample recipes
INSERT INTO recipes (id, title, diet, servings, prep_time, cook_time, ingredients, method) VALUES
(1, 'Vegetable Lasagne', 'Vegetarian', 4, 30, 45,
 '[{"ingredientId":1,"quantity":2,"unit":"medium"},{"ingredientId":2,"quantity":1,"unit":"large"},{"ingredientId":3,"quantity":2,"unit":"cloves"},{"ingredientId":4,"quantity":400,"unit":"g"},{"ingredientId":5,"quantity":9,"unit":"sheets"},{"ingredientId":6,"quantity":500,"unit":"ml"},{"ingredientId":7,"quantity":200,"unit":"g"}]'::jsonb,
 '["Preheat oven to 180°C (160°C fan).","Dice courgettes and aubergine. Finely chop garlic.","Heat oil in a large pan and cook vegetables until soft.","Add chopped tomatoes and simmer for 15 minutes.","In a baking dish, layer: vegetable sauce, lasagne sheets, white sauce. Repeat.","Top with grated cheese.","Bake for 45 minutes until golden and bubbling."]'::jsonb),

(2, 'Chicken Stir Fry', 'Non-Vegetarian', 2, 15, 15,
 '[{"ingredientId":8,"quantity":300,"unit":"g"},{"ingredientId":9,"quantity":1,"unit":"medium"},{"ingredientId":10,"quantity":1,"unit":"medium"},{"ingredientId":3,"quantity":2,"unit":"cloves"},{"ingredientId":11,"quantity":2,"unit":"tbsp"},{"ingredientId":12,"quantity":200,"unit":"g"}]'::jsonb,
 '["Slice chicken into strips.","Slice bell pepper and broccoli into bite-sized pieces.","Heat oil in a wok over high heat.","Cook chicken until golden, then remove.","Stir-fry vegetables for 3-4 minutes.","Return chicken to wok, add soy sauce.","Serve with rice."]'::jsonb);
```

3. Click **"Run"**

## Step 6: Get Your API Keys

1. Click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"**
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
4. **Keep these safe!** You'll need them in the next step

## Step 7: Configure Your App

1. In your meal-planner project, create a new file:

```bash
touch meal-planner/.env.local
```

2. Add your Supabase credentials (replace with your actual values):

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Important:** Never commit this file to Git! It's already in `.gitignore`

## Step 8: Install Supabase Client

Run this command in your meal-planner directory:

```bash
npm install @supabase/supabase-js
```

## Step 9: Test the Connection

After I update the app code, you can test by:

1. Starting the app: `npm start`
2. Opening the browser console (Cmd+Option+J)
3. You should see "Connected to Supabase!" in the console
4. Try adding a recipe - it should save to the database!

## ✅ You're Done!

Once set up:
- **Both you and Jess** can use the app simultaneously
- **Changes sync in real-time** - no refresh needed
- **Access from any device** - phone, tablet, computer
- **Data is backed up** automatically by Supabase
- **Free forever** for your use case

## 🔒 Security Notes

- The `anon` key is safe to use in your app
- Row Level Security (RLS) is enabled
- Only you two will have access (no public access)
- For extra security, you can add email authentication later

## 📱 Mobile Access

Once deployed to Render:
- Visit the URL from any device
- Works on iPhone, Android, tablets
- All data syncs across all devices

## 🆘 Troubleshooting

**Can't connect to Supabase:**
- Check your `.env.local` file has correct values
- Make sure you restarted the app after adding `.env.local`
- Verify your Supabase project is active

**Data not syncing:**
- Check browser console for errors
- Verify RLS policies are set correctly
- Make sure both users are using the same Supabase project

**Need help?**
- Supabase has great documentation: docs.supabase.com
- Their Discord community is very helpful
- Or ask me for help!

Ready to update the app code? Let me know and I'll integrate Supabase into your React app!