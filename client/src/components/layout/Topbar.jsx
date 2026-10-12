// Topbar with dynamic user details, notifications and profile.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react'

import './Topbar.css'

const getLoggedInUser = () => {
  try {
    const storedUser =
      localStorage.getItem('user') ||
      sessionStorage.getItem('user') ||
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('currentUser')

    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const navigate = useNavigate()
  const user = getLoggedInUser()

  const userName = user?.name?.trim() || 'User'
  const userEmail = user?.email || ''
  const userRole = user?.role || 'student'

  const roleLabel =
    userRole.charAt(0).toUpperCase() + userRole.slice(1)

  const accountLabel = userEmail
    ? `${userName}'s account`
    : `${roleLabel} account`

  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const dashboardPath =
    userRole === 'admin'
      ? '/admin/dashboard'
      : userRole === 'staff'
        ? '/staff/dashboard'
        : '/dashboard'

  const profilePath =
    userRole === 'admin'
      ? '/admin/profile'
      : userRole === 'staff'
        ? '/staff/profile'
        : '/student/profile'

  const handleSearch = (event) => {
    event.preventDefault()

    const query = searchQuery.trim()

    if (query && userRole === 'student') {
      navigate(
        `/student/complaints?search=${encodeURIComponent(query)}`
      )
    } else if (query) {
      navigate(dashboardPath)
    }
  }

  const handleLogout = () => {
    // Remove authentication details only.
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentUser')

    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('currentUser')

    navigate('/login', { replace: true })
  }

  return (
    <header className="campus-topbar">
      <div className="campus-topbar-left">
        <div className="campus-topbar-heading">
          <span className="campus-topbar-label">
            YOUR CAMPUS, YOUR VOICE
          </span>

          <h2>
            {userRole === 'admin'
              ? 'Admin Portal'
              : userRole === 'staff'
                ? 'Staff Portal'
                : 'Student Portal'}
          </h2>
        </div>
      </div>

      <div className="campus-topbar-actions">
        <form className="campus-search" onSubmit={handleSearch}>
          <Search size={18} />

          <input
            type="search"
            placeholder="Search complaints..."
            aria-label="Search complaints"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
          />

          <button type="submit" aria-label="Submit search">
            Search
          </button>
        </form>

        {/* Notifications */}
        <div className="campus-topbar-dropdown">
          <button
            type="button"
            className={`campus-icon-button ${
              showNotifications ? 'is-open' : ''
            }`}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfileMenu(false)
            }}
          >
            <Bell size={19} />
            <span className="campus-notification-dot" />
          </button>

          {showNotifications && (
            <div className="campus-dropdown-panel campus-notification-panel">
              <div className="campus-dropdown-heading">
                <strong>Notifications</strong>
                <span>Recent updates</span>
              </div>

              <div className="campus-notification-item">
                <span className="campus-notification-indicator" />

                <div>
                  <p>Your campus updates will appear here.</p>
                  <small>
                    Stay tuned for complaint progress.
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="campus-dropdown-link"
                onClick={() => {
                  setShowNotifications(false)
                  navigate(
                    userRole === 'admin'
                      ? '/admin/dashboard'
                      : userRole === 'staff'
                        ? '/staff/dashboard'
                        : '/student/notifications'
                  )
                }}
              >
                View updates
              </button>
            </div>
          )}
        </div>

        {/* Dynamic user profile */}
        <div className="campus-topbar-dropdown">
          <button
            type="button"
            className="campus-topbar-profile"
            aria-expanded={showProfileMenu}
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
              setShowNotifications(false)
            }}
          >
            <span className="campus-topbar-avatar">
              {initials}
            </span>

            <span className="campus-topbar-user">
              <strong>{userName}</strong>
              <small>{accountLabel}</small>
            </span>

            <ChevronDown size={16} />
          </button>

          {showProfileMenu && (
            <div className="campus-dropdown-panel campus-profile-panel">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false)
                  navigate(profilePath)
                }}
              >
                My Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}