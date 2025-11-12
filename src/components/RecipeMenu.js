import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/RecipeMenu.css';

function RecipeMenu({ recipes, ingredients, onAddRecipe, onUpdateRecipe, onDeleteRecipe }) {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    diet: '',
    cuisine: '',
    rating: '',
    time: '',
    difficulty: ''
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    diet: 'Vegetarian',
    cuisine: 'Other',
    rating: 0,
    difficulty: 'Medium',
    tags: [],
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
      window.history.replaceState({}, document.title);
    }
  }, [location.state, recipes]);

  // Helper function to get ingredient name
  const getIngredientName = (ingredientId) => {
    const ingredient = ingredients.find(i => i.id === parseInt(ingredientId));
    return ingredient ? ingredient.name : 'Unknown';
  };

  // Get all unique tags from recipes
  const allTags = useMemo(() => {
    const tagSet = new Set();
    recipes.forEach(recipe => {
      if (recipe.tags) {
        recipe.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [recipes]);

  // Filter and search recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        recipe.title.toLowerCase().includes(searchLower) ||
        (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        (recipe.cuisine && recipe.cuisine.toLowerCase().includes(searchLower)) ||
        recipe.ingredients.some(ing => {
          const ingredient = ingredients.find(i => i.id === parseInt(ing.ingredientId));
          const ingredientName = ingredient ? ingredient.name.toLowerCase() : '';
          return ingredientName.includes(searchLower);
        });

      // Diet filter
      const matchesDiet = !filters.diet || recipe.diet === filters.diet;

      // Cuisine filter
      const matchesCuisine = !filters.cuisine || recipe.cuisine === filters.cuisine;

      // Rating filter
      const matchesRating = !filters.rating || (recipe.rating || 0) >= parseFloat(filters.rating);

      // Time filter
      const totalTime = recipe.prepTime + recipe.cookTime;
      let matchesTime = true;
      if (filters.time === '30') matchesTime = totalTime <= 30;
      else if (filters.time === '60') matchesTime = totalTime <= 60;
      else if (filters.time === '120') matchesTime = totalTime <= 120;
      else if (filters.time === '121') matchesTime = totalTime > 120;

      // Difficulty filter
      const matchesDifficulty = !filters.difficulty || recipe.difficulty === filters.difficulty;

      // Tags filter
      const matchesTags = selectedTags.length === 0 ||
        (recipe.tags && selectedTags.every(tag => recipe.tags.includes(tag)));

      return matchesSearch && matchesDiet && matchesCuisine &&
             matchesRating && matchesTime && matchesDifficulty && matchesTags;
    });
  }, [recipes, searchTerm, filters, selectedTags, ingredients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      diet: '',
      cuisine: '',
      rating: '',
      time: '',
      difficulty: ''
    });
    setSelectedTags([]);
  };

  const activeFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.diet) count++;
    if (filters.cuisine) count++;
    if (filters.rating) count++;
    if (filters.time) count++;
    if (filters.difficulty) count++;
    count += selectedTags.length;
    return count;
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
      rating: parseFloat(formData.rating) || 0,
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
      cuisine: 'Other',
      rating: 0,
      difficulty: 'Medium',
      tags: [],
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
      cuisine: recipe.cuisine || 'Other',
      rating: recipe.rating || 0,
      difficulty: recipe.difficulty || 'Medium',
      tags: recipe.tags || [],
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

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
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
                <label>Cuisine</label>
                <select name="cuisine" value={formData.cuisine} onChange={handleInputChange}>
                  <option value="Italian">Italian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Indian">Indian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="British">British</option>
                  <option value="Thai">Thai</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="American">American</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rating (0-5)</label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.5"
                />
              </div>
            </div>

            <div className="form-row">
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

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                })}
                placeholder="e.g., quick, healthy, budget-friendly"
              />
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

            {selectedRecipe.rating > 0 && (
              <div className="recipe-rating">
                {renderStars(selectedRecipe.rating)}
                <span className="rating-value">({selectedRecipe.rating.toFixed(1)})</span>
              </div>
            )}

            <div className="recipe-meta-info">
              <span className="meta-item">🥗 {selectedRecipe.diet}</span>
              <span className="meta-item">🌍 {selectedRecipe.cuisine || 'Other'}</span>
              <span className="meta-item">📊 {selectedRecipe.difficulty || 'Medium'}</span>
              <span className="meta-item">👥 Serves {selectedRecipe.servings}</span>
              <span className="meta-item">⏱️ Prep: {selectedRecipe.prepTime} mins</span>
              <span className="meta-item">🔥 Cook: {selectedRecipe.cookTime} mins</span>
            </div>

            {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
              <div className="recipe-tags">
                {selectedRecipe.tags.map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            )}

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
        <>
          {/* Search and Filter Bar */}
          <div className="search-filter-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="🔍 Search recipes, ingredients, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <button 
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '▼' : '▶'} Filters
              {activeFilterCount() > 0 && (
                <span className="filter-count">{activeFilterCount()}</span>
              )}
            </button>

            {showFilters && (
              <div className="filter-bar">
                <div className="filter-row">
                  <select 
                    value={filters.diet} 
                    onChange={(e) => handleFilterChange('diet', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Diets</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Pescatarian">Pescatarian</option>
                  </select>

                  <select 
                    value={filters.cuisine} 
                    onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Cuisines</option>
                    <option value="Italian">Italian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Indian">Indian</option>
                    <option value="Mexican">Mexican</option>
                    <option value="British">British</option>
                    <option value="Thai">Thai</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="American">American</option>
                    <option value="Other">Other</option>
                  </select>

                  <select 
                    value={filters.rating} 
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Ratings</option>
                    <option value="4">4★ and above</option>
                    <option value="3">3★ and above</option>
                    <option value="2">2★ and above</option>
                    <option value="1">1★ and above</option>
                  </select>

                  <select 
                    value={filters.time} 
                    onChange={(e) => handleFilterChange('time', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Any Time</option>
                    <option value="30">Under 30 mins</option>
                    <option value="60">Under 1 hour</option>
                    <option value="120">Under 2 hours</option>
                    <option value="121">Over 2 hours</option>
                  </select>

                  <select 
                    value={filters.difficulty} 
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {allTags.length > 0 && (
                  <div className="tag-filter">
                    <span className="tag-filter-label">Tags:</span>
                    <div className="tag-chips">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                          onClick={() => toggleTag(tag)}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeFilterCount() > 0 && (
                  <button className="clear-filters-btn" onClick={clearAllFilters}>
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            <div className="results-count">
              Showing {filteredRecipes.length} of {recipes.length} recipes
            </div>
          </div>

          {/* Recipe Grid */}
          <div className="recipe-grid">
            {filteredRecipes.length === 0 ? (
              <div className="empty-state">
                <p>
                  {recipes.length === 0 
                    ? "No recipes yet. Click 'Add New Recipe' to get started!"
                    : "No recipes match your search criteria. Try adjusting your filters."}
                </p>
              </div>
            ) : (
              filteredRecipes.map(recipe => (
                <div 
                  key={recipe.id} 
                  className="recipe-card"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <h3>{recipe.title}</h3>
                  {recipe.rating > 0 && (
                    <div className="recipe-card-rating">
                      {renderStars(recipe.rating)}
                    </div>
                  )}
                  <div className="recipe-card-meta">
                    <span>{recipe.diet}</span>
                    <span>{recipe.cuisine || 'Other'}</span>
                    <span>{recipe.prepTime + recipe.cookTime} mins</span>
                  </div>
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="recipe-card-tags">
                      {recipe.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="mini-tag">#{tag}</span>
                      ))}
                      {recipe.tags.length > 3 && (
                        <span className="mini-tag">+{recipe.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default RecipeMenu;