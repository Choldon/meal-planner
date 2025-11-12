import React, { useState } from 'react';
import { 
  importRecipeFromUrl, 
  matchIngredients, 
  createMissingIngredients,
  validateRecipe,
  formatRecipeForDatabase,
  getSupportedWebsites 
} from '../utils/recipeImporter';
import '../styles/RecipeImportModal.css';

function RecipeImportModal({ isOpen, onClose, ingredients, onImportComplete }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importedRecipe, setImportedRecipe] = useState(null);
  const [matchedIngredients, setMatchedIngredients] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [step, setStep] = useState('input'); // 'input', 'preview', 'complete'

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a recipe URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Import recipe from URL
      const { recipe, metadata: importMetadata } = await importRecipeFromUrl(url);
      
      // Match ingredients to database
      const matched = matchIngredients(recipe.ingredients, ingredients);
      
      // Validate recipe
      const validation = validateRecipe(recipe);
      if (!validation.valid) {
        setError(`Recipe validation failed: ${validation.errors.join(', ')}`);
        setLoading(false);
        return;
      }

      setImportedRecipe(recipe);
      setMatchedIngredients(matched);
      setMetadata(importMetadata);
      setStep('preview');

    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create any missing ingredients first
      const unmatched = matchedIngredients.filter(ing => !ing.matched);
      if (unmatched.length > 0) {
        const newIngredients = await createMissingIngredients(unmatched);
        
        // Update matched ingredients with new IDs
        const updatedMatched = matchedIngredients.map(ing => {
          if (!ing.matched) {
            const created = newIngredients.find(n => n.ingredientName === ing.ingredientName);
            return created || ing;
          }
          return ing;
        });
        setMatchedIngredients(updatedMatched);
      }

      // Format recipe for database
      const formattedRecipe = formatRecipeForDatabase(importedRecipe, matchedIngredients);

      // Call parent callback with formatted recipe
      onImportComplete(formattedRecipe, metadata);
      
      // Reset and close
      handleClose();

    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setError(null);
    setImportedRecipe(null);
    setMatchedIngredients([]);
    setMetadata(null);
    setStep('input');
    onClose();
  };

  const handleBack = () => {
    setStep('input');
    setError(null);
  };

  if (!isOpen) return null;

  const supportedSites = getSupportedWebsites();
  const unmatchedCount = matchedIngredients.filter(ing => !ing.matched).length;

  return (
    <div className="recipe-import-overlay">
      <div className="recipe-import-modal">
        <div className="import-header">
          <h2>🌐 Import Recipe from URL</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="import-body">
          {step === 'input' && (
            <>
              <div className="url-input-section">
                <label htmlFor="recipe-url">Recipe URL</label>
                <input
                  id="recipe-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.bbcgoodfood.com/recipes/..."
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && handleImport()}
                />
                {error && (
                  <div className="error-message">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              <div className="supported-sites">
                <h4>Supported Websites</h4>
                <div className="sites-grid">
                  {supportedSites.map((site, index) => (
                    <div key={index} className="site-item">
                      <span className="site-icon">{site.icon}</span>
                      <span className="site-name">{site.name}</span>
                    </div>
                  ))}
                </div>
                <p className="sites-note">
                  💡 Works with most recipe websites! The AI will extract the recipe data automatically.
                </p>
              </div>

              <div className="import-info">
                <h4>How it works:</h4>
                <ol>
                  <li>Paste a recipe URL from any website</li>
                  <li>AI extracts the recipe data automatically</li>
                  <li>Review and edit the imported recipe</li>
                  <li>Save to your collection</li>
                </ol>
                <p className="cost-info">
                  💰 Cost: ~$0.001 per import (less than 1 cent!)
                </p>
              </div>
            </>
          )}

          {step === 'preview' && importedRecipe && (
            <div className="recipe-preview">
              <div className="preview-header">
                <h3>{importedRecipe.title}</h3>
                <div className="preview-meta">
                  <span>🥗 {importedRecipe.diet}</span>
                  <span>🌍 {importedRecipe.cuisine}</span>
                  <span>📊 {importedRecipe.difficulty}</span>
                  <span>👥 {importedRecipe.servings} servings</span>
                  <span>⏱️ {importedRecipe.prepTime + importedRecipe.cookTime} mins</span>
                </div>
              </div>

              {importedRecipe.tags && importedRecipe.tags.length > 0 && (
                <div className="preview-tags">
                  {importedRecipe.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="preview-section">
                <h4>Ingredients ({matchedIngredients.length})</h4>
                {unmatchedCount > 0 && (
                  <div className="unmatched-notice">
                    ℹ️ {unmatchedCount} new ingredient{unmatchedCount !== 1 ? 's' : ''} will be added to your database
                  </div>
                )}
                <ul className="ingredients-preview">
                  {matchedIngredients.map((ing, index) => (
                    <li key={index} className={ing.matched ? 'matched' : 'unmatched'}>
                      <span className="ing-quantity">{ing.quantity} {ing.unit}</span>
                      <span className="ing-name">{ing.ingredientName}</span>
                      {!ing.matched && <span className="new-badge">NEW</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="preview-section">
                <h4>Method ({importedRecipe.method.length} steps)</h4>
                <ol className="method-preview">
                  {importedRecipe.method.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              {metadata && (
                <div className="import-metadata">
                  <p>✨ Imported using {metadata.model}</p>
                  <p>💰 Cost: ${metadata.estimatedCost.toFixed(6)}</p>
                  <p>🔢 Tokens: {metadata.tokensUsed}</p>
                </div>
              )}

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="import-footer">
          {step === 'input' && (
            <>
              <button onClick={handleClose} className="btn-cancel" disabled={loading}>
                Cancel
              </button>
              <button 
                onClick={handleImport} 
                className="btn-import" 
                disabled={loading || !url.trim()}
              >
                {loading ? '⏳ Importing...' : '🌐 Import Recipe'}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button onClick={handleBack} className="btn-back" disabled={loading}>
                ← Back
              </button>
              <button 
                onClick={handleConfirmImport} 
                className="btn-confirm" 
                disabled={loading}
              >
                {loading ? '⏳ Saving...' : '✅ Save Recipe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeImportModal;