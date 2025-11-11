import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Calendar from './components/Calendar';
import RecipeMenu from './components/RecipeMenu';
import ShoppingBasket from './components/ShoppingBasket';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './utils/supabaseClient';
import './styles/App.css';

function AppContent() {
  const [meals, setMeals] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper functions to convert between snake_case and camelCase
  const toCamelCase = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => toCamelCase(item));
    }
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = obj[key];
      return acc;
    }, {});
  };

  // Load all data from Supabase on mount
  useEffect(() => {
    loadAllData();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [mealsRes, recipesRes, ingredientsRes, shoppingRes] = await Promise.all([
        supabase.from('meals').select('*').order('date', { ascending: true }),
        supabase.from('recipes').select('*').order('title', { ascending: true }),
        supabase.from('ingredients').select('*').order('name', { ascending: true }),
        supabase.from('shopping_list').select('*').order('created_at', { ascending: true })
      ]);

      if (mealsRes.error) console.error('Error loading meals:', mealsRes.error);
      else setMeals(toCamelCase(mealsRes.data) || []);

      if (recipesRes.error) console.error('Error loading recipes:', recipesRes.error);
      else setRecipes(toCamelCase(recipesRes.data) || []);

      if (ingredientsRes.error) console.error('Error loading ingredients:', ingredientsRes.error);
      else setIngredients(toCamelCase(ingredientsRes.data) || []);

      if (shoppingRes.error) console.error('Error loading shopping list:', shoppingRes.error);
      else setShoppingList(toCamelCase(shoppingRes.data) || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions for all tables
  const setupRealtimeSubscriptions = () => {
    // Subscribe to meals changes
    const mealsSubscription = supabase
      .channel('meals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, (payload) => {
        handleRealtimeUpdate('meals', payload);
      })
      .subscribe();

    // Subscribe to recipes changes
    const recipesSubscription = supabase
      .channel('recipes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, (payload) => {
        handleRealtimeUpdate('recipes', payload);
      })
      .subscribe();

    // Subscribe to ingredients changes
    const ingredientsSubscription = supabase
      .channel('ingredients_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, (payload) => {
        handleRealtimeUpdate('ingredients', payload);
      })
      .subscribe();

    // Subscribe to shopping_list changes
    const shoppingSubscription = supabase
      .channel('shopping_list_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list' }, (payload) => {
        handleRealtimeUpdate('shopping_list', payload);
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      mealsSubscription.unsubscribe();
      recipesSubscription.unsubscribe();
      ingredientsSubscription.unsubscribe();
      shoppingSubscription.unsubscribe();
    };
  };

  // Handle real-time updates
  const handleRealtimeUpdate = (table, payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Convert snake_case to camelCase
    const newRecordCamel = toCamelCase(newRecord);
    const oldRecordCamel = toCamelCase(oldRecord);

    switch (table) {
      case 'meals':
        if (eventType === 'INSERT') setMeals(prev => [...prev, newRecordCamel]);
        else if (eventType === 'UPDATE') setMeals(prev => prev.map(m => m.id === newRecordCamel.id ? newRecordCamel : m));
        else if (eventType === 'DELETE') setMeals(prev => prev.filter(m => m.id !== oldRecordCamel.id));
        break;
      
      case 'recipes':
        if (eventType === 'INSERT') setRecipes(prev => [...prev, newRecordCamel]);
        else if (eventType === 'UPDATE') setRecipes(prev => prev.map(r => r.id === newRecordCamel.id ? newRecordCamel : r));
        else if (eventType === 'DELETE') setRecipes(prev => prev.filter(r => r.id !== oldRecordCamel.id));
        break;
      
      case 'ingredients':
        if (eventType === 'INSERT') setIngredients(prev => [...prev, newRecordCamel]);
        else if (eventType === 'UPDATE') setIngredients(prev => prev.map(i => i.id === newRecordCamel.id ? newRecordCamel : i));
        else if (eventType === 'DELETE') setIngredients(prev => prev.filter(i => i.id !== oldRecordCamel.id));
        break;
      
      case 'shopping_list':
        if (eventType === 'INSERT') setShoppingList(prev => [...prev, newRecordCamel]);
        else if (eventType === 'UPDATE') setShoppingList(prev => prev.map(s => s.id === newRecordCamel.id ? newRecordCamel : s));
        else if (eventType === 'DELETE') setShoppingList(prev => prev.filter(s => s.id !== oldRecordCamel.id));
        break;
      
      default:
        console.warn('Unknown table:', table);
        break;
    }
  };

  // MEALS OPERATIONS
  const addMeal = async (meal) => {
    try {
      // Convert camelCase to snake_case for database
      const dbMeal = {
        id: meal.id,
        date: meal.date,
        meal_type: meal.mealType,
        recipe_id: meal.recipeId,
        people: meal.people
      };

      const { data, error } = await supabase
        .from('meals')
        .insert([dbMeal])
        .select()
        .single();

      if (error) throw error;

      // Real-time subscription will automatically update the meals state
      // No need to manually update here to avoid duplicates

      // Add recipe ingredients to shopping list
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (recipe && recipe.ingredients) {
        const servingsMultiplier = meal.people.length / recipe.servings;
        const shoppingItems = [];

        for (const ing of recipe.ingredients) {
          const newQuantity = ing.quantity * servingsMultiplier;
          
          // Check if ingredient already exists
          const { data: existing } = await supabase
            .from('shopping_list')
            .select('*')
            .eq('ingredient_id', ing.ingredientId)
            .eq('unit', ing.unit)
            .maybeSingle();

          if (existing) {
            // Update existing item
            await supabase
              .from('shopping_list')
              .update({
                quantity: existing.quantity + newQuantity,
                recipe_name: existing.recipe_name
                  ? `${existing.recipe_name}, ${recipe.title}`
                  : recipe.title,
                is_recipe_item: true
              })
              .eq('id', existing.id);
          } else {
            // Add new item - don't include id, let Supabase generate it
            shoppingItems.push({
              ingredient_id: ing.ingredientId,
              quantity: newQuantity,
              unit: ing.unit,
              checked: false,
              meal_id: data.id,
              recipe_id: meal.recipeId,
              recipe_name: recipe.title,
              is_recipe_item: true
            });
          }
        }

        if (shoppingItems.length > 0) {
          const { error: insertError } = await supabase
            .from('shopping_list')
            .insert(shoppingItems)
            .select();
          
          if (insertError) {
            console.error('Error inserting shopping items:', insertError);
            throw insertError;
          }

          // Real-time subscription will automatically update the shopping list
          // No need to manually update here to avoid duplicates
        }
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Failed to add meal. Please try again.');
    }
  };

  const updateMeal = async (mealId, updatedMeal) => {
    try {
      const { error } = await supabase
        .from('meals')
        .update(updatedMeal)
        .eq('id', mealId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating meal:', error);
      alert('Failed to update meal. Please try again.');
    }
  };

  const deleteMeal = async (mealId) => {
    try {
      // Delete associated shopping items first
      await supabase
        .from('shopping_list')
        .delete()
        .eq('meal_id', mealId);

      // Then delete the meal
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal. Please try again.');
    }
  };

  // RECIPES OPERATIONS
  const addRecipe = async (recipe) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .insert([{ ...recipe, id: Date.now() }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding recipe:', error);
      alert('Failed to add recipe. Please try again.');
    }
  };

  const updateRecipe = async (recipeId, updatedRecipe) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ ...updatedRecipe, updated_at: new Date().toISOString() })
        .eq('id', recipeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Failed to update recipe. Please try again.');
    }
  };

  const deleteRecipe = async (recipeId) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe. Please try again.');
    }
  };

  // INGREDIENTS OPERATIONS
  const addIngredient = async (ingredient) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .insert([{ ...ingredient, id: Date.now() }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding ingredient:', error);
      alert('Failed to add ingredient. Please try again.');
    }
  };

  const updateIngredient = async (ingredientId, updatedIngredient) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update(updatedIngredient)
        .eq('id', ingredientId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ingredient:', error);
      alert('Failed to update ingredient. Please try again.');
    }
  };

  const deleteIngredient = async (ingredientId) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', ingredientId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      alert('Failed to delete ingredient. Please try again.');
    }
  };

  // SHOPPING LIST OPERATIONS
  const addShoppingItem = async (item) => {
    try {
      // Check if ingredient already exists
      const { data: existing } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('ingredient_id', item.ingredientId)
        .eq('unit', item.unit)
        .maybeSingle();

      if (existing) {
        // Update existing item
        await supabase
          .from('shopping_list')
          .update({
            quantity: existing.quantity + parseFloat(item.quantity)
          })
          .eq('id', existing.id);
      } else {
        // Add new item - don't include id, let Supabase generate it
        await supabase
          .from('shopping_list')
          .insert([{
            ingredient_id: item.ingredientId,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            checked: false,
            is_recipe_item: false
          }]);
      }
    } catch (error) {
      console.error('Error adding shopping item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  const toggleShoppingItem = async (itemId) => {
    try {
      const item = shoppingList.find(i => i.id === itemId);
      if (!item) return;

      const { error } = await supabase
        .from('shopping_list')
        .update({ checked: !item.checked })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const updateShoppingItem = async (itemId, updates) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const deleteShoppingItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const clearCheckedItems = async () => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('checked', true);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing items:', error);
      alert('Failed to clear items. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading your meal planner...</h2>
      </div>
    );
  }

  return (
    <div className="App">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar
                  meals={meals}
                  recipes={recipes}
                  onAddMeal={addMeal}
                  onUpdateMeal={updateMeal}
                  onDeleteMeal={deleteMeal}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <RecipeMenu
                  recipes={recipes}
                  ingredients={ingredients}
                  onAddRecipe={addRecipe}
                  onUpdateRecipe={updateRecipe}
                  onDeleteRecipe={deleteRecipe}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopping"
            element={
              <ProtectedRoute>
                <ShoppingBasket
                  shoppingList={shoppingList}
                  ingredients={ingredients}
                  onAddItem={addShoppingItem}
                  onUpdateItem={updateShoppingItem}
                  onToggleItem={toggleShoppingItem}
                  onDeleteItem={deleteShoppingItem}
                  onClearChecked={clearCheckedItems}
                  onAddIngredient={addIngredient}
                  onUpdateIngredient={updateIngredient}
                  onDeleteIngredient={deleteIngredient}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;