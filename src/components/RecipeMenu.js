import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/RecipeMenu.css';

function RecipeMenu({ recipes, ingredients, onAddRecipe, onUpdateRecipe, onDeleteRecipe }) {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    diet: 'Vegetarian',
    servings: 2,
    prepTime: 0,
    cookTime: 0,
    ingredients: [],
    method: ['']
  });

  // Auto-open recipe when navigated from calendar
  useEffect(() => {
    if (location.state?.openRecipeId) {
      const recipe = recipes.find(r => r.id === location.state.openRecipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
        setShowForm(false);
      }
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state, recipes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMethodChange = (index, value) => {
    const newMethod = [...formData.method];
    newMethod[index] = value;
    setFormData({ ...formData, method: newMethod });
  };

  const addMethodStep = () => {
    setFormData({ ...formData, method: [...formData.method, ''] });
  };

  const removeMethodStep = (index) => {
    const newMethod = formData.method.filter((_, i) => i !== index);
    setFormData({ ...formData, method: newMethod });
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredientId: '', quantity: 0, unit: '' }]
    });
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = field === 'quantity' ? parseFloat(value) || 0 : value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const removeIngredient = (index) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a recipe title');
      return;
    }

    if (formData.ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    if (formData.method.filter(step => step.trim()).length === 0) {
      alert('Please add at least one method step');
      return;
    }

    const recipe = {
      ...formData,
      servings: parseInt(formData.servings),
      prepTime: parseInt(formData.prepTime),
      cookTime: parseInt(formData.cookTime),
      method: formData.method.filter(step => step.trim())
    };

    if (editingRecipe) {
      onUpdateRecipe(editingRecipe.id, { ...recipe, id: editingRecipe.id });
    } else {
      onAddRecipe(recipe);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      diet: 'Vegetarian',
      servings: 2,
      prepTime: 0,
      cookTime: 0,
      ingredients: [],
      method: ['']
    });
    setShowForm(false);
    setEditingRecipe(null);
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title,
      diet: recipe.diet,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      ingredients: recipe.ingredients,
      method: recipe.method
    });
    setShowForm(true);
    setSelectedRecipe(null);
  };

  const handleDelete = (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      onDeleteRecipe(recipeId);
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
      }
    }
  };

  const getIngredientName = (ingredientId) => {
    const ingredient = ingredients.find(i => i.id === parseInt(ingredientId));
    return ingredient ? ingredient.name : 'Unknown';
  };

  return (
    <div className="recipe-menu-container">
      <div className="recipe-menu-header">
        <h2>Recipe Collection</h2>
        <button 
          onClick={() => {
            setShowForm(true);
            setEditingRecipe(null);
            setSelectedRecipe(null);
          }} 
          className="btn-add"
        >
          + Add New Recipe
        </button>
      </div>

      {showForm ? (
        <div className="recipe-form-container">
          <h3>{editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</h3>
          <form onSubmit={handleSubmit} className="recipe-form">
            <div className="form-group">
              <label>Recipe Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Diet Type</label>
                <select name="diet" value={formData.diet} onChange={handleInputChange}>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Pescatarian">Pescatarian</option>
                </select>
              </div>

              <div className="form-group">
                <label>Servings</label>
                <input
                  type="number"
                  name="servings"
                  value={formData.servings}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Prep Time (mins)</label>
                <input
                  type="number"
                  name="prepTime"
                  value={formData.prepTime}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Cook Time (mins)</label>
                <input
                  type="number"
                  name="cookTime"
                  value={formData.cookTime}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Ingredients</h4>
              {formData.ingredients.map((ing, index) => (
                <div key={index} className="ingredient-row">
                  <select
                    value={ing.ingredientId}
                    onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                    required
                  >
                    <option value="">Select ingredient</option>
                    {ingredients.map(ingredient => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    step="0.1"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g., g, ml, tbsp)"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={addIngredient} className="btn-add-item">
                + Add Ingredient
              </button>
            </div>

            <div className="form-section">
              <h4>Method</h4>
              {formData.method.map((step, index) => (
                <div key={index} className="method-row">
                  <span className="step-number">{index + 1}.</span>
                  <textarea
                    value={step}
                    onChange={(e) => handleMethodChange(index, e.target.value)}
                    placeholder="Describe this step..."
                    rows="2"
                  />
                  {formData.method.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMethodStep(index)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addMethodStep} className="btn-add-item">
                + Add Step
              </button>
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                {editingRecipe ? 'Update Recipe' : 'Add Recipe'}
              </button>
            </div>
          </form>
        </div>
      ) : selectedRecipe ? (
        <div className="recipe-detail">
          <button onClick={() => setSelectedRecipe(null)} className="btn-back">
            ← Back to List
          </button>
          
          <div className="recipe-detail-content">
            <div className="recipe-detail-header">
              <h2>{selectedRecipe.title}</h2>
              <div className="recipe-actions">
                <button onClick={() => handleEdit(selectedRecipe)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(selectedRecipe.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>

            <div className="recipe-meta-info">
              <span className="meta-item">🥗 {selectedRecipe.diet}</span>
              <span className="meta-item">👥 Serves {selectedRecipe.servings}</span>
              <span className="meta-item">⏱️ Prep: {selectedRecipe.prepTime} mins</span>
              <span className="meta-item">🔥 Cook: {selectedRecipe.cookTime} mins</span>
            </div>

            <div className="recipe-section">
              <h3>Ingredients</h3>
              <ul className="ingredients-list">
                {selectedRecipe.ingredients.map((ing, index) => (
                  <li key={index}>
                    {ing.quantity} {ing.unit} {getIngredientName(ing.ingredientId)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="recipe-section">
              <h3>Method</h3>
              <ol className="method-list">
                {selectedRecipe.method.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.length === 0 ? (
            <div className="empty-state">
              <p>No recipes yet. Click "Add New Recipe" to get started!</p>
            </div>
          ) : (
            recipes.map(recipe => (
              <div 
                key={recipe.id} 
                className="recipe-card"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <h3>{recipe.title}</h3>
                <div className="recipe-card-meta">
                  <span>{recipe.diet}</span>
                  <span>Serves {recipe.servings}</span>
                  <span>{recipe.prepTime + recipe.cookTime} mins</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default RecipeMenu;