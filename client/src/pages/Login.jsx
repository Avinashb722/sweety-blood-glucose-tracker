import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login({
        email: email.trim(),
        password
      });

      if (res.success && res.data.token) {
        localStorage.setItem('sweety_token', res.data.token);
        localStorage.setItem('sweety_user', JSON.stringify(res.data.user));
        navigate('/');
      } else {
        setErrorMessage(res.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@sweety.com');
    setPassword('Demo@123');
    setErrorMessage('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span>🍬</span> Sweety
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to track your blood glucose readings</p>
        </div>

        {/* Demo Account Box */}
        <div className="demo-credentials-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Demo: <strong>demo@sweety.com</strong> (Demo@123)</span>
            <button
              type="button"
              onClick={handleFillDemo}
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Fill Demo
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '10px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
