import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Reset token is missing from the URL.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword({
        token,
        newPassword
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Invalid or expired reset link. Please request a new one.'
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
          <h1>Create New Password</h1>
          <p>Choose a secure password for your account</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div>
            <div className="alert alert-success" role="alert">
              <span>✅</span>
              <span>Password has been reset successfully!</span>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/login')}
              style={{ marginTop: '12px' }}
            >
              Go to Sign In →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {!token && (
              <div className="alert alert-danger">
                <span>⚠️</span>
                <span>No reset token provided. Please request a new password reset link.</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">
                New Password (min. 6 characters)
              </label>
              <input
                id="newPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: '10px' }}
              disabled={isLoading || !token}
            >
              {isLoading ? 'Resetting password...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
