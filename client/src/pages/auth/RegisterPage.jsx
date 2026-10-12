import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserRound,
  GraduationCap,
  Building2,
  ArrowRight,
} from 'lucide-react'

import apiRequest from '../../services/api.js'
import campusImage from '../../assets/images/campus.jpg'
import './LoginPage.css'
import './RegisterPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    collegeId: '',
    department: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  const handleRoleChange = (newRole) => {
    setRole(newRole)

    setFormData((previous) => ({
      ...previous,
      department: '',
    }))

    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const name = formData.fullName.trim()
    const email = formData.email.trim().toLowerCase()
    const collegeId = formData.collegeId.trim()
    const department = formData.department

    if (name.length < 2) {
      setError('Name must contain at least 2 characters.')
      return
    }

    if (!collegeId) {
      setError(
        `Please enter your ${role === 'student' ? 'Student ID' : 'Staff ID'}.`
      )
      return
    }

    if (!department) {
      setError('Please select your department.')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password: formData.password,
          department,
          collegeId,
          role,
        }),
      })

      if (!response || response.success === false) {
        throw new Error(
          response?.message || 'Registration failed. Please try again.'
        )
      }

      // Staff registrations must wait for Admin approval.
      if (role === 'staff') {
        setSuccess(
          response.message ||
            'Staff registration submitted successfully. Please wait for Admin approval before logging in.'
        )

        // Keep the user on the page long enough to read the message.
        setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: {
              registeredEmail: email,
              registrationPending: true,
            },
          })
        }, 2500)

        return
      }

      // Student registration
      setSuccess(
        response.message ||
          'Account created successfully! Redirecting you to login...'
      )

      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            registeredEmail: email,
          },
        })
      }, 1500)
    } catch (err) {
      console.error('Registration failed:', err)

      setError(
        err.message ||
          'Unable to create your account. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      className="fmc-login-page fmc-register-page"
      style={{ '--campus-image': `url("${campusImage}")` }}
    >
      <div className="fmc-login-overlay" />

      <header className="fmc-login-navbar">
        <Link to="/" className="fmc-login-logo">
          <span className="fmc-logo-icon">F</span>

          <span>
            Campus<span>Fix</span>
          </span>
        </Link>

        <nav className="fmc-login-nav">
          <Link to="/">Home</Link>
          <a href="/#about">About</a>
          <a href="/#services">Services</a>
          <a href="/#contact">Contact</a>
        </nav>

        <Link to="/login" className="fmc-nav-login">
          Login
        </Link>
      </header>

      <section className="fmc-login-content fmc-register-content">
        <div className="fmc-login-intro fmc-register-intro">
          <span className="fmc-login-eyebrow">
            YOUR CAMPUS. YOUR VOICE.
          </span>

          <h1>
            Be part of the
            <br />
            <span>change you want.</span>
          </h1>

          <p>
            Join your campus community, report issues, track
            progress, and help create a better campus experience
            for everyone.
          </p>
        </div>

        <div className="fmc-glass-card fmc-register-card">
          <div className="fmc-card-close">
            <button
              type="button"
              aria-label="Back to homepage"
              onClick={() => navigate('/')}
            >
              ×
            </button>
          </div>

          <div className="fmc-card-heading">
            <span className="fmc-card-badge">
              GET STARTED TODAY
            </span>

            <h2>Create account</h2>

            <p>Join CampusFix and make a difference.</p>
          </div>

          <div className="fmc-register-role-label">
            Register as
          </div>

          <div className="fmc-register-role-switch">
            <button
              type="button"
              className={role === 'student' ? 'active' : ''}
              onClick={() => handleRoleChange('student')}
              aria-pressed={role === 'student'}
            >
              <GraduationCap size={17} />
              Student
            </button>

            <button
              type="button"
              className={role === 'staff' ? 'active' : ''}
              onClick={() => handleRoleChange('staff')}
              aria-pressed={role === 'staff'}
            >
              <Building2 size={17} />
              Staff
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Full name */}
            <div className="fmc-input-group fmc-register-input-group">
              <label htmlFor="register-name">Full name</label>

              <div className="fmc-input-wrapper">
                <UserRound size={18} />

                <input
                  id="register-name"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="fmc-input-group fmc-register-input-group">
              <label htmlFor="register-email">College email</label>

              <div className="fmc-input-wrapper">
                <Mail size={18} />

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Student ID / Staff ID */}
            <div className="fmc-input-group fmc-register-input-group">
              <label htmlFor="register-college-id">
                {role === 'student' ? 'Student ID' : 'Staff ID'}
              </label>

              <div className="fmc-input-wrapper">
                {role === 'student' ? (
                  <GraduationCap size={18} />
                ) : (
                  <Building2 size={18} />
                )}

                <input
                  id="register-college-id"
                  name="collegeId"
                  type="text"
                  placeholder={
                    role === 'student'
                      ? 'Enter your student ID'
                      : 'Enter your staff ID'
                  }
                  value={formData.collegeId}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Department */}
            <div className="fmc-input-group fmc-register-input-group">
              <label htmlFor="register-department">
                Department
              </label>

              <div className="fmc-input-wrapper">
                <Building2 size={18} />

                <select
                  id="register-department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your department</option>

                  {role === 'student' ? (
                    <>
                      <option value="Computer Science and Engineering">
                        Computer Science and Engineering
                      </option>

                      <option value="Information Technology">
                        Information Technology
                      </option>

                      <option value="Electronics and Communication Engineering">
                        Electronics and Communication Engineering
                      </option>

                      <option value="Electrical and Electronics Engineering">
                        Electrical and Electronics Engineering
                      </option>

                      <option value="Mechanical Engineering">
                        Mechanical Engineering
                      </option>

                      <option value="Civil Engineering">
                        Civil Engineering
                      </option>

                      <option value="Artificial Intelligence and Machine Learning">
                        Artificial Intelligence and Machine Learning
                      </option>

                      <option value="Data Science">
                        Data Science
                      </option>
                    </>
                  ) : (
                    <>
                      <option value="Electrical Maintenance">
                        Electrical Maintenance
                      </option>

                      <option value="Plumbing and Water Supply">
                        Plumbing and Water Supply
                      </option>

                      <option value="Civil Maintenance">
                        Civil Maintenance
                      </option>

                      <option value="Housekeeping and Sanitation">
                        Housekeeping and Sanitation
                      </option>

                      <option value="Network and IT Support">
                        Network and IT Support
                      </option>

                      <option value="Laboratory Maintenance">
                        Laboratory Maintenance
                      </option>

                      <option value="Furniture and Carpentry">
                        Furniture and Carpentry
                      </option>

                      <option value="Security Services">
                        Security Services
                      </option>

                      <option value="Gardening and Landscaping">
                        Gardening and Landscaping
                      </option>

                      <option value="General Maintenance">
                        General Maintenance
                      </option>
                    </>
                  )}

                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="fmc-input-group fmc-register-input-group">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="fmc-input-wrapper">
                <Lock size={18} />

                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
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
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="fmc-input-group fmc-register-input-group">
              <label htmlFor="register-confirm-password">
                Confirm password
              </label>

              <div className="fmc-input-wrapper">
                <Lock size={18} />

                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={
                    showConfirmPassword ? 'text' : 'password'
                  }
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="fmc-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="fmc-register-error" role="alert">
                {error}
              </p>
            )}

            {/* Success message */}
            {success && (
              <p
                role="status"
                style={{
                  color: '#D5EAD1',
                  fontSize: '14px',
                  marginBottom: '14px',
                }}
              >
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="fmc-submit-button fmc-register-submit"
              disabled={isLoading}
            >
              <span>
                {isLoading
                  ? 'Creating account...'
                  : role === 'staff'
                    ? 'Submit for approval'
                    : 'Create my account'}
              </span>

              <ArrowRight size={19} />
            </button>
          </form>

          {role === 'staff' && (
            <p className="fmc-register-approval-note">
              Staff accounts require Admin approval before login.
            </p>
          )}

          <div className="fmc-register-prompt">
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </div>

          <div className="fmc-card-footer">
            <span className="fmc-footer-line" />
            <span>BUILT FOR A BETTER CAMPUS</span>
            <span className="fmc-footer-line" />
          </div>
        </div>
      </section>

      <footer className="fmc-login-footer">
        <span>© 2026 CampusFix</span>
        <span>Small actions. Meaningful change.</span>
      </footer>
    </main>
  )
}