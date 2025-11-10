import React, { useState } from 'react';
import '../styles/ShoppingBasket.css';

function ShoppingBasket({
  shoppingList,
  ingredients,
  onAddItem,
  onUpdateItem,
  onToggleItem,
  onDeleteItem,
  onClearChecked,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  
  const [newItem, setNewItem] = useState({
    ingredientId: '',
    quantity: 1,
    unit: '',
    category: 'Other'
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    category: 'Fruit & Veg'
  });

  const categories = ['Fruit & Veg', 'Fridge', 'Cupboard', 'Frozen', 'Refill', 'Other'];

  // Group shopping list items by category
  const groupedItems = () => {
    const groups = {};
    
    shoppingList.forEach(item => {
      const ingredient = ingredients.find(i => i.id === parseInt(item.ingredientId));
      const category = ingredient?.category || 'Other';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      
      groups[category].push({
        ...item,
        ingredientName: ingredient?.name || 'Unknown',
        category
      });
    });

    return groups;
  };

  const handleAddItem = () => {
    if (!newItem.ingredientId) {
      alert('Please select an ingredient');
      return;
    }

    onAddItem({
      ingredientId: newItem.ingredientId,
      quantity: parseFloat(newItem.quantity) || 1,
      unit: newItem.unit
    });

    setNewItem({
      ingredientId: '',
      quantity: 1,
      unit: '',
      category: 'Other'
    });
    setShowAddItem(false);
  };

  const handleAddIngredient = () => {
    if (!ingredientForm.name.trim()) {
      alert('Please enter an ingredient name');
      return;
    }

    if (editingIngredient) {
      onUpdateIngredient(editingIngredient.id, {
        ...ingredientForm,
        id: editingIngredient.id
      });
    } else {
      onAddIngredient(ingredientForm);
    }

    setIngredientForm({ name: '', category: 'Fruit & Veg' });
    setEditingIngredient(null);
    setShowAddIngredient(false);
  };

  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    setIngredientForm({
      name: ingredient.name,
      category: ingredient.category
    });
    setShowAddIngredient(true);
  };

  const handleDeleteIngredient = (ingredientId) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      onDeleteIngredient(ingredientId);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem({
      id: item.id,
      quantity: item.quantity,
      unit: item.unit
    });
    setShowEditItem(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem || editingItem.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    onUpdateItem(editingItem.id, {
      quantity: parseFloat(editingItem.quantity),
      unit: editingItem.unit
    });

    setEditingItem(null);
    setShowEditItem(false);
  };

  // Filter ingredients by category and search term for the settings modal
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesCategory = selectedCategory ? ingredient.category === selectedCategory : true;
    const matchesSearch = ingredientSearchTerm
      ? ingredient.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  // Filter ingredients for the add item dropdown based on search
  const searchFilteredIngredients = searchTerm
    ? ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ingredients;

  const grouped = groupedItems();

  return (
    <div className="shopping-basket-container">
      <div className="shopping-header">
        <h2>Shopping Basket</h2>
        <div className="shopping-actions">
          <button onClick={() => setShowAddItem(true)} className="btn-add">
            + Add Item
          </button>
          <button onClick={onClearChecked} className="btn-clear">
            Clear Checked
          </button>
          <button onClick={() => setShowSettings(true)} className="btn-settings">
            ⚙️ Ingredients
          </button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <p>Your shopping basket is empty. Add meals to your calendar to populate the list!</p>
        </div>
      ) : (
        <div className="shopping-cards">
          {categories.map(category => {
            const items = grouped[category];
            if (!items || items.length === 0) return null;

            return (
              <div key={category} className="shopping-card">
                <h3 className="card-title">{category}</h3>
                <ul className="shopping-items">
                  {items.map(item => (
                    <li key={item.id} className={`shopping-item ${item.checked ? 'checked' : ''}`}>
                      <label className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => onToggleItem(item.id)}
                        />
                        <span className={`item-text ${item.isRecipeItem ? 'recipe-item' : 'adhoc-item'}`}>
                          {item.quantity.toFixed(1)} {item.unit} {item.ingredientName}
                          {item.isRecipeItem && item.recipeName && (
                            <span className="item-badge" title={`From: ${item.recipeName}`}>
                              {item.recipeName}
                            </span>
                          )}
                        </span>
                      </label>
                      <div className="item-actions">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="btn-edit-item"
                          title="Edit quantity"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="btn-delete-item"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Shopping Item</h3>
            <div className="form-group">
              <label>Search Ingredient</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search ingredients..."
                className="search-input"
              />
            </div>
            <div className="form-group">
              <label>Ingredient</label>
              <select
                value={newItem.ingredientId}
                onChange={(e) => setNewItem({ ...newItem, ingredientId: e.target.value })}
                size="8"
                className="ingredient-select-list"
              >
                <option value="">Select ingredient</option>
                {searchFilteredIngredients.map(ing => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.category})
                  </option>
                ))}
              </select>
              {searchTerm && searchFilteredIngredients.length === 0 && (
                <p className="no-results">No ingredients found matching "{searchTerm}"</p>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="e.g., g, ml, items"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowAddItem(false);
                  setSearchTerm('');
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={handleAddItem} className="btn-confirm">
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Ingredients Database</h3>
            
            <div className="form-group">
              <label>Search Ingredients</label>
              <input
                type="text"
                value={ingredientSearchTerm}
                onChange={(e) => setIngredientSearchTerm(e.target.value)}
                placeholder="Type to search ingredients..."
                className="search-input"
              />
            </div>

            <div className="settings-header">
              <div className="category-filter">
                <label>Filter by category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setShowAddIngredient(true);
                  setEditingIngredient(null);
                  setIngredientForm({ name: '', category: 'Fruit & Veg' });
                }}
                className="btn-add"
              >
                + Add Ingredient
              </button>
            </div>

            <div className="ingredients-list-container">
              {filteredIngredients.length === 0 ? (
                <p className="no-results">
                  {ingredientSearchTerm || selectedCategory
                    ? `No ingredients found matching your search criteria.`
                    : 'No ingredients found.'}
                </p>
              ) : (
                <table className="ingredients-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.map(ingredient => (
                      <tr key={ingredient.id}>
                        <td>{ingredient.name}</td>
                        <td>{ingredient.category}</td>
                        <td>
                          <button
                            onClick={() => handleEditIngredient(ingredient)}
                            className="btn-edit-small"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ingredient.id)}
                            className="btn-delete-small"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowSettings(false);
                  setIngredientSearchTerm('');
                  setSelectedCategory('');
                }}
                className="btn-confirm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Ingredient Modal */}
      {showAddIngredient && (
        <div className="modal-overlay" onClick={() => setShowAddIngredient(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</h3>
            <div className="form-group">
              <label>Ingredient Name</label>
              <input
                type="text"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                placeholder="e.g., Tomatoes"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={ingredientForm.category}
                onChange={(e) => setIngredientForm({ ...ingredientForm, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowAddIngredient(false);
                  setEditingIngredient(null);
                }} 
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={handleAddIngredient} className="btn-confirm">
                {editingIngredient ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItem && editingItem && (
        <div className="modal-overlay" onClick={() => setShowEditItem(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Item Quantity</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  placeholder="e.g., g, ml, items"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowEditItem(false);
                  setEditingItem(null);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={handleUpdateItem} className="btn-confirm">
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShoppingBasket;