import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/Login.css';

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      
      // User will be redirected to Google for authentication
      // After successful auth, they'll be redirected back to the app
      
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🍽️ Kit & Jess's Meal Planner</h1>
          <p>Plan your meals, manage recipes, and sync with Google Calendar</p>
        </div>

        <div className="login-content">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="google-sign-in-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
              <p className="error-hint">
                Make sure you're added as a test user in Google Cloud Console.
              </p>
            </div>
          )}

          <div className="login-info">
            <h3>What you'll get:</h3>
            <ul>
              <li>✅ Access to shared meal planner</li>
              <li>✅ Sync meals to Google Calendar</li>
              <li>✅ Manage recipes and shopping lists</li>
              <li>✅ Real-time updates across devices</li>
            </ul>
          </div>

          <div className="login-footer">
            <p>
              By signing in, you grant access to your Google Calendar to sync meal events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;