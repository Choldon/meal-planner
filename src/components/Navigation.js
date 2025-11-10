import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation() {
  const location = useLocation();

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
      </div>
    </nav>
  );
}

export default Navigation;