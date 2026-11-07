import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      if (res.success && res.data) {
        setSuccessInfo(res.data);
      } else {
        setErrorMessage(res.message || 'Unable to generate reset link.');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'No account found with this email address.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span>🍬</span> Sweety
          </div>
          <h1>Reset Password</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successInfo ? (
          <div>
            <div className="alert alert-success" role="alert">
              <span>✅</span>
              <span>Reset link generated! Valid for 15 minutes.</span>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                Password Reset Link:
              </div>
              <div
                style={{
                  wordBreak: 'break-all',
                  color: '#db2777',
                  fontFamily: 'monospace',
                  marginBottom: '12px'
                }}
              >
                {successInfo.resetUrl}
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate(`/reset-password?token=${successInfo.resetToken}`)}
              >
                Continue to Set New Password →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Registered Email Address
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
              <div className="form-hint">
                Demo user: <code>demo@sweety.com</code>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: '10px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Generating link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remember your password? <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
