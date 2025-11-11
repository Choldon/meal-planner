import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navigation.css';

function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">Kit & Jess's Meal Planner</h1>
        <ul className="nav-menu">
          <li>
            <Link
              to="/calendar"
              className={location.pathname === '/calendar' ? 'active' : ''}
            >
              📅 Calendar
            </Link>
          </li>
          <li>
            <Link
              to="/recipes"
              className={location.pathname === '/recipes' ? 'active' : ''}
            >
              📖 Recipes
            </Link>
          </li>
          <li>
            <Link
              to="/shopping"
              className={location.pathname === '/shopping' ? 'active' : ''}
            >
              🛒 Shopping Basket
            </Link>
          </li>
        </ul>
        
        {user && (
          <div className="user-menu-container">
            <button
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || user.email}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                </div>
              )}
              <span className="user-name">
                {user.user_metadata?.full_name || user.email}
              </span>
            </button>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <p className="user-email">{user.email}</p>
                </div>
                <button
                  className="sign-out-button"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;