import { useState } from 'react'
import {
  UserRound,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  CalendarDays,
  Pencil,
  Save,
  X,
  ShieldCheck,
} from 'lucide-react'

import MainLayout from '../../components/layout/MainLayout'
import './ProfilePage.css'

// Get the currently logged-in user
function getLoggedInUser() {
  try {
    const storedUser =
      localStorage.getItem('user') ||
      sessionStorage.getItem('user') ||
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('currentUser')

    return storedUser ? JSON.parse(storedUser) : null
  } catch (error) {
    console.error('Unable to read logged-in user:', error)
    return null
  }
}

const initialProfile = {
  name: 'Student',
  email: 'student@campus.edu',
  phone: '',
  studentId: '',
  department: 'Department not specified',
  year: '3rd Year',
  joinedDate: '2024',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => {
    const user = getLoggedInUser()

    let savedProfile = {}

    try {
      const saved = sessionStorage.getItem('campusfixStudentProfile')

      if (saved) {
        savedProfile = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Unable to read saved profile:', error)
    }

    // Login details take priority over old demo profile details.
    return {
      ...initialProfile,
      ...savedProfile,
      name: user?.name || savedProfile.name || initialProfile.name,
      email: user?.email || savedProfile.email || initialProfile.email,
      department:
        user?.department ||
        savedProfile.department ||
        initialProfile.department,
      studentId:
        user?.studentId ||
        savedProfile.studentId ||
        initialProfile.studentId,
    }
  })

  const [formData, setFormData] = useState(profile)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setMessage('')
  }

  function handleSave(event) {
    event.preventDefault()

    if (!formData.name.trim()) {
      setMessage('Please enter your name.')
      return
    }

    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      setMessage('Please enter a valid email address.')
      return
    }

    if (!formData.studentId.trim()) {
      setMessage('Please enter your student ID.')
      return
    }

    const updatedProfile = {
      ...profile,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      studentId: formData.studentId.trim(),
    }

    setProfile(updatedProfile)
    setFormData(updatedProfile)

    try {
      sessionStorage.setItem(
        'campusfixStudentProfile',
        JSON.stringify(updatedProfile)
      )

      setEditing(false)
      setMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Unable to save profile:', error)
      setMessage('Unable to save profile. Please try again.')
    }
  }

  function handleCancel() {
    setFormData(profile)
    setEditing(false)
    setMessage('')
  }

  const initials =
    profile.name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'S'

  return (
    <MainLayout>
      <div className="campus-profile-page">
        {/* PAGE HEADING */}
        <header className="profile-page-heading">
          <div>
            <span className="profile-eyebrow">
              <UserRound size={15} />
              STUDENT ACCOUNT
            </span>

            <h1>My Profile</h1>

            <p>
              Manage your personal information and view your student
              account details.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              className="profile-edit-button"
              onClick={() => {
                setFormData(profile)
                setEditing(true)
                setMessage('')
              }}
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </header>

        {/* SUCCESS OR ERROR MESSAGE */}
        {message && (
          <div
            className={`profile-message ${
              message.includes('successfully') ? 'success' : 'error'
            }`}
            role="status"
          >
            {message}
          </div>
        )}

        {/* PROFILE HERO */}
        <section className="profile-hero-card">
          <div className="profile-avatar">
            {initials || <UserRound size={38} />}
          </div>

          <div className="profile-hero-information">
            <span className="profile-member-label">
              <ShieldCheck size={14} />
              CAMPUS MEMBER
            </span>

            <h2>{profile.name}</h2>

            <p>{profile.email}</p>

            <span className="profile-department-label">
              <GraduationCap size={15} />
              {profile.department}
            </span>
          </div>

          <div className="profile-role-badge">Student</div>
        </section>

        {/* PROFILE INFORMATION */}
        <div className="profile-content-grid">
          {/* PERSONAL INFORMATION */}
          <section className="profile-information-card">
            <div className="profile-card-heading">
              <span className="profile-card-icon">
                <UserRound size={19} />
              </span>

              <div>
                <h2>Personal Information</h2>
                <p>Your basic contact details.</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="profile-form-grid">
                {/* NAME */}
                <div className="profile-field">
                  <label htmlFor="profile-name">Full Name</label>

                  <div className="profile-input-wrapper">
                    <UserRound size={17} />

                    <input
                      id="profile-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your full name"
                      maxLength={80}
                      required
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="profile-field">
                  <label htmlFor="profile-email">Email Address</label>

                  <div className="profile-input-wrapper">
                    <Mail size={17} />

                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* PHONE */}
                <div className="profile-field">
                  <label htmlFor="profile-phone">Phone Number</label>

                  <div className="profile-input-wrapper">
                    <Phone size={17} />

                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your phone number"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* STUDENT ID */}
                <div className="profile-field">
                  <label htmlFor="profile-student-id">Student ID</label>

                  <div className="profile-input-wrapper">
                    <ShieldCheck size={17} />

                    <input
                      id="profile-student-id"
                      name="studentId"
                      type="text"
                      value={formData.studentId}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your student ID"
                    />
                  </div>
                </div>
              </div>

              {/* EDIT ACTIONS */}
              {editing && (
                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={handleCancel}
                  >
                    <X size={16} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="profile-save-button"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* ACADEMIC INFORMATION */}
          <section className="profile-information-card">
            <div className="profile-card-heading">
              <span className="profile-card-icon">
                <GraduationCap size={20} />
              </span>

              <div>
                <h2>Academic Information</h2>
                <p>Your campus and course details.</p>
              </div>
            </div>

            <div className="profile-academic-list">
              <div className="profile-academic-item">
                <span className="profile-academic-icon">
                  <Building2 size={17} />
                </span>

                <div>
                  <span>Department</span>
                  <strong>{profile.department}</strong>
                </div>
              </div>

              <div className="profile-academic-item">
                <span className="profile-academic-icon">
                  <GraduationCap size={17} />
                </span>

                <div>
                  <span>Academic Year</span>
                  <strong>{profile.year}</strong>
                </div>
              </div>

              <div className="profile-academic-item">
                <span className="profile-academic-icon">
                  <CalendarDays size={17} />
                </span>

                <div>
                  <span>Joining Year</span>
                  <strong>{profile.joinedDate}</strong>
                </div>
              </div>
            </div>

            <div className="profile-academic-note">
              <ShieldCheck size={17} />

              <p>
                Academic details are currently read-only demo information.
                They are not yet connected to your account in the database.
              </p>
            </div>
          </section>
        </div>

        {/* SECURITY NOTE */}
        <section className="profile-security-note">
          <ShieldCheck size={21} />

          <div>
            <h3>Your information matters</h3>

            <p>
              Your name, email, and department are displayed using your
              logged-in account details. Profile edits are currently saved
              in this browser session; database profile updates require
              backend integration.
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}