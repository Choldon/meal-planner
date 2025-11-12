import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navigation.css';

function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      setShowMobileMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-header">
          <h1 className="nav-title">Kit & Jess's Meal Planner</h1>
          <button
            className="hamburger-menu"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${showMobileMenu ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${showMobileMenu ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${showMobileMenu ? 'open' : ''}`}></span>
          </button>
        </div>
        <ul className={`nav-menu ${showMobileMenu ? 'mobile-open' : ''}`}>
          <li>
            <Link
              to="/calendar"
              className={location.pathname === '/calendar' ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              📅 Calendar
            </Link>
          </li>
          <li>
            <Link
              to="/recipes"
              className={location.pathname === '/recipes' ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              📖 Recipes
            </Link>
          </li>
          <li>
            <Link
              to="/shopping"
              className={location.pathname === '/shopping' ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              🛒 Shopping Basket
            </Link>
          </li>
          {user && (
            <li className="mobile-user-item">
              <div className="mobile-user-info">
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
                <div className="mobile-user-details">
                  <span className="mobile-user-name">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <span className="mobile-user-email">{user.email}</span>
                </div>
              </div>
              <button
                className="mobile-sign-out"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </li>
          )}
        </ul>
        
        {user && (
          <div className="user-menu-container desktop-only">
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