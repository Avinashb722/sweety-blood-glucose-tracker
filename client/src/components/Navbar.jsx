import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userJson = localStorage.getItem('sweety_user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('sweety_token');
    localStorage.removeItem('sweety_user');
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="nav-brand">
          <div className="nav-logo-icon">🍬</div>
          <span>Sweety</span>
        </Link>

        <nav className="nav-links">
          <button
            type="button"
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => onTabChange('reports')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Reports
          </button>
        </nav>

        <div className="nav-user">
          {user && (
            <span className="user-badge">
              👤 {user.name}
            </span>
          )}
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

