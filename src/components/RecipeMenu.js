import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import RecipeImportModal from './RecipeImportModal';
import '../styles/RecipeMenu.css';

function RecipeMenu({ recipes, ingredients, onAddRecipe, onUpdateRecipe, onDeleteRecipe }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
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
  const [tagsInput, setTagsInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImageImportInfo, setShowImageImportInfo] = useState(false);
  const [importMode, setImportMode] = useState('url'); // 'url' or 'image'
  const [imageData, setImageData] = useState(null);
  const fileInputRef = useRef(null);
  
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

  // Auto-open recipe when navigated from calendar or URL parameter
  useEffect(() => {
    console.log('=== RecipeMenu useEffect triggered ===');
    console.log('Recipes loaded:', recipes.length);
    console.log('Search params:', searchParams.toString());
    console.log('Location state:', location.state);
    
    // Wait for recipes to load
    if (recipes.length === 0) {
      console.log('Waiting for recipes to load...');
      return;
    }
    
    // Check URL parameter first (from Google Calendar links)
    const recipeIdParam = searchParams.get('recipeId');
    console.log('Recipe ID from URL:', recipeIdParam);
    
    if (recipeIdParam) {
      const recipeId = parseInt(recipeIdParam);
      console.log('Searching for recipe with ID:', recipeId);
      console.log('Available recipe IDs:', recipes.map(r => r.id));
      
      const recipe = recipes.find(r => r.id === recipeId);
      console.log('Found recipe:', recipe ? recipe.title : 'NOT FOUND');
      
      if (recipe) {
        console.log('Opening recipe:', recipe.title);
        setSelectedRecipe(recipe);
        setShowForm(false);
      } else {
        console.warn('Recipe not found with ID:', recipeId);
        console.warn('Available recipes:', recipes.map(r => ({ id: r.id, title: r.title })));
      }
      return;
    }
    
    // Then check location state (from internal navigation)
    if (location.state?.openRecipeId) {
      const recipe = recipes.find(r => r.id === location.state.openRecipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
        setShowForm(false);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, searchParams, recipes]);

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
    const { name, value, type } = e.target;
    // For number inputs, allow empty string for easier editing
    if (type === 'number') {
      setFormData({ ...formData, [name]: value === '' ? '' : value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

  const moveMethodStepUp = (index) => {
    if (index === 0) return; // Can't move first step up
    const newMethod = [...formData.method];
    [newMethod[index - 1], newMethod[index]] = [newMethod[index], newMethod[index - 1]];
    setFormData({ ...formData, method: newMethod });
  };

  const moveMethodStepDown = (index) => {
    if (index === formData.method.length - 1) return; // Can't move last step down
    const newMethod = [...formData.method];
    [newMethod[index], newMethod[index + 1]] = [newMethod[index + 1], newMethod[index]];
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
    // Allow empty string for quantity to make editing easier
    if (field === 'quantity') {
      newIngredients[index][field] = value === '' ? '' : value;
    } else {
      newIngredients[index][field] = value;
    }
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

    // Convert tags input string to array
    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    const recipe = {
      ...formData,
      tags: tagsArray,
      servings: parseInt(formData.servings) || 1,
      prepTime: parseInt(formData.prepTime) || 0,
      cookTime: parseInt(formData.cookTime) || 0,
      rating: parseFloat(formData.rating) || 0,
      ingredients: formData.ingredients.map(ing => ({
        ...ing,
        quantity: parseFloat(ing.quantity) || 0
      })),
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
    setTagsInput('');
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
    setTagsInput(recipe.tags ? recipe.tags.join(', ') : '');
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

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG, PNG, etc.)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        setImageData(base64String);
        setImportMode('image');
        setShowImportModal(true);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    event.target.value = '';
  };

  const handleImportComplete = (importedRecipe, metadata) => {
    // The modal has already created the missing ingredients in the database
    // The importedRecipe now has all the correct ingredientIds
    
    // Set the imported recipe data into the form
    setFormData({
      title: importedRecipe.title,
      diet: importedRecipe.diet,
      cuisine: importedRecipe.cuisine,
      rating: importedRecipe.rating,
      difficulty: importedRecipe.difficulty,
      tags: importedRecipe.tags,
      servings: importedRecipe.servings,
      prepTime: importedRecipe.prepTime,
      cookTime: importedRecipe.cookTime,
      ingredients: importedRecipe.ingredients,
      method: importedRecipe.method
    });
    setTagsInput(importedRecipe.tags.join(', '));
    
    // Show the form with imported data
    setShowForm(true);
    setEditingRecipe(null);
    setSelectedRecipe(null);
    
    // Show success message
    const source = importMode === 'image' ? 'image' : 'URL';
    alert(`✅ Recipe imported successfully from ${source}!\n💰 Cost: $${metadata.estimatedCost.toFixed(6)}\n\nAll ingredients have been added to your database.\n\nReview and save the recipe.`);
    
    // Reset import state
    setImageData(null);
    setImportMode('url');
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
      {/* Hidden file input for image import - must be outside dropdown */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageSelect}
      />
      
      <div className="recipe-menu-header">
        <h2>Recipe Collection</h2>
        <div className="add-recipe-dropdown">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="btn-add"
          >
            + Add New Recipe
          </button>
          {showAddMenu && (
            <div className="dropdown-menu">
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingRecipe(null);
                  setSelectedRecipe(null);
                  setShowAddMenu(false);
                }}
                className="dropdown-item"
              >
                ✏️ Create Manually
              </button>
              <button
                onClick={() => {
                  setImportMode('url');
                  setShowImportModal(true);
                  setShowAddMenu(false);
                }}
                className="dropdown-item"
              >
                🌐 Import from URL
              </button>
              <button
                onClick={() => {
                  setShowAddMenu(false);
                  setShowImageImportInfo(true);
                }}
                className="dropdown-item"
              >
                📸 Import from Image
              </button>
            </div>
          )}
        </div>
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
                  placeholder="0"
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
                  placeholder="2"
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
                  placeholder="0"
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
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
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
                    placeholder="0"
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
                  <div className="method-controls">
                    <button
                      type="button"
                      onClick={() => moveMethodStepUp(index)}
                      className="btn-move-up"
                      disabled={index === 0}
                      title="Move step up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMethodStepDown(index)}
                      className="btn-move-down"
                      disabled={index === formData.method.length - 1}
                      title="Move step down"
                    >
                      ▼
                    </button>
                    {formData.method.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMethodStep(index)}
                        className="btn-remove"
                        title="Remove step"
                      >
                        ✕
                      </button>
                    )}
                  </div>
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

      {/* Image Import Info Modal */}
      {showImageImportInfo && (
        <div className="modal-overlay" onClick={() => setShowImageImportInfo(false)}>
          <div className="modal-content import-info-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📸 Import Recipe from Image</h3>
            
            <div className="import-info-content">
              <p className="info-intro">
                Upload a photo of a recipe and AI will extract all the details automatically!
              </p>

              <div className="supported-formats">
                <h4>✅ Supported Image Types:</h4>
                <ul>
                  <li>📋 <strong>Recipe Cards</strong> - Meal kit cards (Gusto, HelloFresh, etc.)</li>
                  <li>📖 <strong>Cookbook Pages</strong> - Photos of cookbook recipes</li>
                  <li>📱 <strong>Screenshots</strong> - Recipe screenshots from websites or apps</li>
                  <li>✍️ <strong>Handwritten Recipes</strong> - Clear handwritten recipe cards</li>
                  <li>🖨️ <strong>Printed Recipes</strong> - Printed recipe sheets</li>
                </ul>
              </div>

              <div className="import-tips">
                <h4>💡 Tips for Best Results:</h4>
                <ul>
                  <li>Ensure text is clear and readable</li>
                  <li>Good lighting helps with accuracy</li>
                  <li>Include the full recipe in the image</li>
                  <li>Supported formats: JPEG, PNG (max 10MB)</li>
                </ul>
              </div>

              <div className="cost-info">
                <p>💰 <strong>Cost:</strong> ~$0.002-0.03 per image (less than 3 cents!)</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowImageImportInfo(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowImageImportInfo(false);
                  fileInputRef.current?.click();
                }}
                className="btn-confirm"
              >
                📸 Choose Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Recipe Import Modal */}
      <RecipeImportModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImageData(null);
          setImportMode('url');
        }}
        ingredients={ingredients}
        onImportComplete={handleImportComplete}
        mode={importMode}
        imageData={imageData}
      />
    </div>
  );
}

export default RecipeMenu;