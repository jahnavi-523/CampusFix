import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
} from 'lucide-react'

import apiRequest from '../../services/api.js'
import campusImage from '../../assets/images/campus.jpg'
import './LoginPage.css'

const ROLES = [
  {
    value: 'student',
    label: 'Student',
  },
  {
    value: 'staff',
    label: 'Staff',
  },
  {
    value: 'admin',
    label: 'Admin',
  },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [selectedRole, setSelectedRole] = useState('student')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    if (!email || !password) {
      setErrorMessage('Please enter your email and password.')
      return
    }

    setIsLoading(true)

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const user =
        response?.user ||
        response?.data?.user ||
        response?.data ||
        null

      const token =
        response?.token ||
        response?.accessToken ||
        response?.data?.token ||
        response?.data?.accessToken

      if (!token) {
        throw new Error(
          'Login token missing. Please check the backend login response.'
        )
      }

      if (!user) {
        throw new Error(
          'User details missing from the login response.'
        )
      }

      const actualRole = String(user.role || '').toLowerCase()

      if (!['student', 'staff', 'admin'].includes(actualRole)) {
        throw new Error('Invalid user role received from the server.')
      }

      // Verify the selected role against the database role.
      if (actualRole !== selectedRole) {
        const selectedLabel =
          ROLES.find((role) => role.value === selectedRole)?.label

        throw new Error(
          `This account is not registered as ${selectedLabel}. Please select the correct role.`
        )
      }

      // Remove previous authentication information.
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('currentUser')

      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('currentUser')

      // Store authentication in the selected storage.
      const storage = rememberMe ? localStorage : sessionStorage

      storage.setItem('token', token)
      storage.setItem('user', JSON.stringify(user))
      storage.setItem('currentUser', JSON.stringify(user))

      // Redirect according to the verified database role.
      if (actualRole === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (actualRole === 'staff') {
        navigate('/staff/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('Login failed:', error)

      setErrorMessage(
        error.message ||
          'Unable to log in. Please check your credentials and try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      className="fmc-login-page"
      style={{
        '--campus-image': `url("${campusImage}")`,
      }}
    >
      <div className="fmc-login-overlay" />

      {/* Navbar */}
      <header className="fmc-login-navbar">
        <Link to="/" className="fmc-login-logo">
          <span className="fmc-logo-icon">F</span>

          <span>
            Campus<span>Fix</span>
          </span>
        </Link>

        <nav className="fmc-login-nav">
  <a href="/#home">Home</a>
  <a href="/#about">About</a>
  <a href="/#features">Services</a>
  <a href="/#how-it-works">Contact</a>
</nav>

        <Link to="/login" className="fmc-nav-login">
          Login
        </Link>
      </header>

      {/* Main content */}
      <section className="fmc-login-content">
        {/* Left introduction */}
        <div className="fmc-login-intro">
          <span className="fmc-login-eyebrow">
            YOUR CAMPUS. YOUR VOICE.
          </span>

          <h1>
            Together, we make
            <br />
            <span>campus better.</span>
          </h1>

          <p>
            Report issues, track progress, and help create
            a better campus experience for everyone.
          </p>
        </div>

        {/* Login card */}
        <div className="fmc-glass-card">
          <div className="fmc-card-close">
            <button
              type="button"
              aria-label="Back to homepage"
              onClick={() => navigate('/')}
            >
              ×
            </button>
          </div>

          {/* Heading */}
          <div className="fmc-card-heading">
            <span className="fmc-card-badge">
              WELCOME BACK
            </span>

            <h2>Log in</h2>

            <p>
              Select your role to continue to CampusFix.
            </p>
          </div>

          {/* Simple role selector */}
          <div
            className="fmc-role-selection"
            aria-label="Select your role"
          >
            {ROLES.map(({ value, label }) => (
              <button
                type="button"
                key={value}
                className={`fmc-role-option ${
                  selectedRole === value
                    ? 'fmc-role-option-active'
                    : ''
                }`}
                onClick={() => {
                  setSelectedRole(value)
                  setErrorMessage('')
                }}
                aria-pressed={selectedRole === value}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="fmc-input-group">
               <label htmlFor="login-email">
  {selectedRole === 'student'
    ? 'Student email'
    : selectedRole === 'staff'
      ? 'Staff email'
      : 'Admin email'}
</label>
              <div className="fmc-input-wrapper">
                <Mail size={19} />

                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder={`Enter ${
  selectedRole === 'admin'
    ? 'admin'
    : selectedRole === 'staff'
      ? 'staff'
      : 'student'
} email`}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="fmc-input-group">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="fmc-input-wrapper">
                <Lock size={19} />

                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="fmc-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="fmc-login-options">
              <label className="fmc-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="fmc-forgot-link"
                onClick={() =>
                  setErrorMessage(
                    'Password reset is not connected yet.'
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div
                role="alert"
                style={{
                  color: '#ffd6d6',
                  fontSize: '13px',
                  marginBottom: '14px',
                  overflowWrap: 'anywhere',
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="fmc-submit-button"
              disabled={isLoading}
            >
              <span>
                {isLoading
                  ? 'Logging in...'
                  : `Login as ${
                      ROLES.find(
                        (role) => role.value === selectedRole
                      )?.label
                    }`}
              </span>

              <ArrowRight size={19} />
            </button>
          </form>

          {/* Register link */}
          <div className="fmc-register-prompt">
            Don't have an account?{' '}
            <Link to="/register">Create account</Link>
          </div>

          {/* Card footer */}
          <div className="fmc-card-footer">
            <span className="fmc-footer-line" />
            <span>BUILT FOR A BETTER CAMPUS</span>
            <span className="fmc-footer-line" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="fmc-login-footer">
        <span>© 2026 CampusFix</span>
        <span>Small actions. Meaningful change.</span>
      </footer>
    </main>
  )
}