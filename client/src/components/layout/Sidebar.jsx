// Role-based sidebar navigation.
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Bell,
  Lightbulb,
  UserRound,
  LogOut,
  Leaf,
  ChevronLeft,
} from 'lucide-react'

import './Sidebar.css'

const navigationItems = [
  {
    label: 'Dashboard',
    path: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Complaints',
    path: '/student/complaints',
    icon: ClipboardList,
  },
  {
    label: 'Report an Issue',
    path: '/student/complaints/new',
    icon: PlusCircle,
  },
  {
    label: 'Notifications',
    path: '/student/notifications',
    icon: Bell,
  },
  {
    label: 'Suggestions',
    path: '/student/suggestions',
    icon: Lightbulb,
  },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?')

    if (confirmed) {
      navigate('/login')
    }
  }

  return (
    <aside className="campus-sidebar">
      <NavLink to="/" className="campus-sidebar-brand">
        <span className="campus-brand-icon">
          <Leaf size={21} strokeWidth={2} />
        </span>

        <span className="campus-brand-name">
          Campus<span>Fix</span>
        </span>
      </NavLink>

      <div className="campus-sidebar-label">WORKSPACE</div>

      <nav className="campus-sidebar-navigation" aria-label="Main navigation">
        {navigationItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/student/dashboard'}
            className={({ isActive }) =>
              `campus-sidebar-link ${isActive ? 'is-active' : ''}`
            }
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="campus-sidebar-bottom">
        <div className="campus-sidebar-help">
          <div className="campus-help-decoration">
            <Leaf size={18} />
          </div>

          <h3>A better campus starts here.</h3>

          <p>
            Every small report can make a meaningful difference.
          </p>

          <button
            type="button"
            onClick={() => navigate('/student/complaints/new')}
          >
            Report an issue
          </button>
        </div>

        <button
          type="button"
          className="campus-sidebar-profile"
          onClick={() => navigate('/student/profile')}
        >
          <span className="campus-avatar">S</span>

          <span className="campus-profile-details">
            <strong>Student</strong>
            <small>Campus member</small>
          </span>

          <ChevronLeft
            className="campus-profile-arrow"
            size={17}
          />
        </button>

        <button
          type="button"
          className="campus-sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}