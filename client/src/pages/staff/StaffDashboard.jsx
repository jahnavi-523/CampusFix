// CampusFix — Staff assigned complaints dashboard.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  Wrench,
  MapPin,
  CalendarDays,
  Search,
  RefreshCw,
  Eye,
  ArrowRight,
  Leaf,
  LogOut,
  UserRound,
  AlertTriangle,
  CircleDot,
} from 'lucide-react'

import { getMyStaffComplaints } from '../../services/staffService.js'

import './StaffDashboard.css'

/* ---------------------------------------
   Helpers
--------------------------------------- */

function getLoggedInStaff() {
  const possibleStorages = [
    localStorage,
    sessionStorage,
  ]

  const possibleKeys = [
    'user',
    'currentUser',
    'loggedInUser',
    'staffUser',
    'profile',
  ]

  for (const storage of possibleStorages) {
    for (const key of possibleKeys) {
      try {
        const storedValue = storage.getItem(key)

        if (!storedValue) continue

        const parsed = JSON.parse(storedValue)

        // Handle both { name: "Ravi Kumar" }
        // and { user: { name: "Ravi Kumar" } }
        const user = parsed?.user || parsed

        const name =
          user?.name ||
          user?.fullName ||
          user?.staffName ||
          user?.username

        if (typeof name === 'string' && name.trim()) {
          return {
            name: name.trim(),
            role: user?.role || 'staff',
          }
        }
      } catch (error) {
        console.error(
          `Unable to read ${key} from storage:`,
          error
        )
      }
    }
  }

  return {
    name: 'Maintenance Staff',
    role: 'staff',
  }
}
function normalizeStatus(status) {
  const value = String(status || 'Pending')
    .trim()
    .toLowerCase()

  if (
    value === 'closed' ||
    value === 'confirmed' ||
    value === 'student confirmed'
  ) {
    return 'Closed'
  }

  if (
    value.includes('awaiting confirmation') ||
    value.includes('pending confirmation')
  ) {
    return 'Awaiting Confirmation'
  }

  if (
    value.includes('resolv') ||
    value.includes('completed')
  ) {
    return 'Awaiting Confirmation'
  }

  if (
    value.includes('progress') ||
    value.includes('working')
  ) {
    return 'In Progress'
  }

  if (
    value.includes('assign') ||
    value.includes('accepted')
  ) {
    return 'Assigned'
  }

  return 'Pending'
}

function normalizePriority(priority) {
  const value = String(priority || 'Medium')
    .trim()
    .toLowerCase()

  if (value === 'low') return 'Low'
  if (value === 'high') return 'High'
  if (value === 'urgent') return 'Urgent'

  return 'Medium'
}

function getComplaintId(complaint) {
  return String(
    complaint?._id ||
    complaint?.id ||
    complaint?.complaintId ||
    ''
  )
}

function getComplaintReference(complaint) {
  return String(
    complaint?.complaintId ||
    complaint?._id ||
    complaint?.id ||
    'N/A'
  )
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/* ---------------------------------------
   Status badge
--------------------------------------- */

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status)

  let Icon = Clock3

  if (normalized === 'Closed') {
    Icon = CheckCircle2
  } else if (normalized === 'Awaiting Confirmation') {
    Icon = Clock3
  } else if (normalized === 'In Progress') {
    Icon = Wrench
  } else if (normalized === 'Assigned') {
    Icon = UserRound
  }

  return (
    <span
      className={`staff-status staff-status-${normalized
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      <Icon size={14} />
      {normalized}
    </span>
  )
}

/* ---------------------------------------
   Priority badge
--------------------------------------- */

function PriorityBadge({ priority }) {
  const normalized = normalizePriority(priority)

  return (
    <span
      className={`staff-priority staff-priority-${normalized.toLowerCase()}`}
    >
      {(normalized === 'High' || normalized === 'Urgent') && (
        <AlertTriangle size={13} />
      )}

      {normalized}
    </span>
  )
}

/* ---------------------------------------
   Main component
--------------------------------------- */

export default function StaffDashboard() {
  const navigate = useNavigate()

  const [staff, setStaff] = useState(getLoggedInStaff)

  const staffName = staff.name
  const firstName = staffName || 'Maintenance Staff'

  const [complaints, setComplaints] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  /* ---------------------------------------
     Refresh logged-in profile
  --------------------------------------- */

  useEffect(() => {
    function refreshStaffProfile() {
      setStaff(getLoggedInStaff())
    }

    window.addEventListener('storage', refreshStaffProfile)

    return () => {
      window.removeEventListener('storage', refreshStaffProfile)
    }
  }, [])

  /* ---------------------------------------
     Fetch complaints from backend
  --------------------------------------- */

  const refreshComplaints = useCallback(async (manual = false) => {
    if (manual) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError('')

    try {
      const response = await getMyStaffComplaints()

      const records = Array.isArray(response)
        ? response
        : Array.isArray(response?.complaints)
          ? response.complaints
          : Array.isArray(response?.data?.complaints)
            ? response.data.complaints
            : []

      setComplaints(records)
    } catch (requestError) {
      console.error(
        'Unable to fetch staff complaints:',
        requestError
      )

      setError(
        requestError.message ||
        'Unable to load assignments. Please try again.'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refreshComplaints()
  }, [refreshComplaints])

  /* ---------------------------------------
     Statistics
  --------------------------------------- */

  const counts = useMemo(() => {
    const assigned = complaints.filter(
      (item) => normalizeStatus(item.status) === 'Assigned'
    ).length

    const progress = complaints.filter(
      (item) => normalizeStatus(item.status) === 'In Progress'
    ).length

    const awaitingConfirmation = complaints.filter(
      (item) =>
        normalizeStatus(item.status) === 'Awaiting Confirmation'
    ).length

    const closed = complaints.filter(
      (item) => normalizeStatus(item.status) === 'Closed'
    ).length

    return {
      total: complaints.length,
      assigned,
      progress,
      awaitingConfirmation,
      closed,
    }
  }, [complaints])

  /* ---------------------------------------
     Search and filter
  --------------------------------------- */

  const filteredComplaints = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return complaints.filter((complaint) => {
      const status = normalizeStatus(complaint.status)

      const matchesFilter =
        activeFilter === 'All' ||
        status === activeFilter

      const searchableValues = [
        complaint.complaintId,
        complaint._id,
        complaint.id,
        complaint.title,
        complaint.category,
        complaint.location,
        complaint.description,
        complaint.priority,
      ]

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || '').toLowerCase().includes(query)
        )

      return matchesFilter && matchesSearch
    })
  }, [complaints, activeFilter, searchTerm])

  /* ---------------------------------------
     Logout
  --------------------------------------- */

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('staffUser')
    localStorage.removeItem('profile')

    navigate('/login', { replace: true })
  }

  /* ---------------------------------------
     Render
  --------------------------------------- */

  return (
    <div className="staff-dashboard">
      {/* Sidebar */}

      <aside className="staff-sidebar">
        <div className="staff-brand">
          <span className="staff-brand-icon">
            <Leaf size={23} />
          </span>

          <span>
            Campus<span>Fix</span>
          </span>
        </div>

        <p className="staff-sidebar-label">
          STAFF WORKSPACE
        </p>

        <div className="staff-active-nav">
          <ClipboardList size={19} />
          <span>My Assignments</span>
        </div>

        <div className="staff-sidebar-message">
          <span className="staff-message-icon">
            <Leaf size={19} />
          </span>

          <h3>Every fix matters.</h3>

          <p>
            Your work helps create a safer, better campus for everyone.
          </p>
        </div>

        <div className="staff-profile">
          <div className="staff-avatar">
            {staffName.charAt(0).toUpperCase()}
          </div>

          <div className="staff-profile-copy">
            <strong>{staffName}</strong>
            <span>Maintenance Staff</span>
          </div>

          <button
            type="button"
            className="staff-logout"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* Main content */}

      <main className="staff-main">
        <header className="staff-topbar">
          <div>
            <span className="staff-eyebrow">
              CAMPUSFIX / STAFF WORKSPACE
            </span>

            <h1>Staff Dashboard</h1>
          </div>

          <div className="staff-topbar-user">
            <span className="staff-online-dot" />

            <div className="staff-avatar">
              {staffName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{staffName}</strong>
              <span>Maintenance Team</span>
            </div>
          </div>
        </header>

        <div className="staff-content">
          {/* Welcome */}

          <section className="staff-welcome">
            <div>
              <span className="staff-welcome-label">
                <CircleDot size={15} />
                YOUR WORKSPACE
              </span>

              <h2>
                Welcome back, {firstName}!
              </h2>

              <p>
                Review your assignments, update repair progress,
                and help keep your campus running smoothly.
              </p>
            </div>

            <div className="staff-welcome-icon">
              <Wrench size={43} />
            </div>
          </section>

          {/* Statistics */}

          <section className="staff-stats-grid">
            <article className="staff-stat-card">
              <div className="staff-stat-heading">
                <span>Total Assignments</span>

                <span className="staff-stat-icon green">
                  <ClipboardList size={20} />
                </span>
              </div>

              <strong>{counts.total}</strong>
              <p>All complaints assigned to you</p>
            </article>

            <article className="staff-stat-card">
              <div className="staff-stat-heading">
                <span>Assigned</span>

                <span className="staff-stat-icon amber">
                  <Clock3 size={20} />
                </span>
              </div>

              <strong>{counts.assigned}</strong>
              <p>Waiting for work to begin</p>
            </article>

            <article className="staff-stat-card">
              <div className="staff-stat-heading">
                <span>In Progress</span>

                <span className="staff-stat-icon blue">
                  <Wrench size={20} />
                </span>
              </div>

              <strong>{counts.progress}</strong>
              <p>Repairs currently underway</p>
            </article>

            <article className="staff-stat-card">
              <div className="staff-stat-heading">
                <span>Awaiting Confirmation</span>

                <span className="staff-stat-icon sage">
                  <CheckCircle2 size={20} />
                </span>
              </div>

              <strong>{counts.awaitingConfirmation}</strong>
              <p>Waiting for student confirmation</p>
            </article>
          </section>

          {/* Assignments */}

          <section className="staff-assignments">
            <div className="staff-section-heading">
              <div>
                <span className="staff-section-eyebrow">
                  TASK MANAGEMENT
                </span>

                <h2>My Assignments</h2>

                <p>
                  Complaints assigned to your staff account.
                </p>
              </div>

              <button
                type="button"
                className="staff-refresh-button"
                onClick={() => refreshComplaints(true)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? 'staff-spin' : ''}
                />

                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Error message */}

            {error && (
              <div className="staff-info-note" role="alert">
                <AlertTriangle size={18} />

                <p>
                  <strong>Could not load assignments:</strong>{' '}
                  {error}
                </p>

                <button
                  type="button"
                  className="staff-refresh-button"
                  onClick={() => refreshComplaints(true)}
                  disabled={isRefreshing}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Search */}

            <div className="staff-toolbar">
              <label className="staff-search">
                <Search size={18} />

                <input
                  type="search"
                  placeholder="Search complaints, IDs or locations..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </label>
            </div>

            {/* Filters */}

            <div className="staff-filter-tabs">
              {[
                'All',
                'Assigned',
                'In Progress',
                'Awaiting Confirmation',
                'Closed',
              ].map((filter) => {
                const filterCount =
                  filter === 'All'
                    ? counts.total
                    : filter === 'Assigned'
                      ? counts.assigned
                      : filter === 'In Progress'
                        ? counts.progress
                        : filter === 'Awaiting Confirmation'
                          ? counts.awaitingConfirmation
                          : counts.closed

                return (
                  <button
                    type="button"
                    key={filter}
                    className={
                      activeFilter === filter ? 'active' : ''
                    }
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                    <span>{filterCount}</span>
                  </button>
                )
              })}
            </div>

            {/* Table */}

            <div className="staff-table-wrapper">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6">
                        <div className="staff-empty-state">
                          <RefreshCw size={28} />

                          <strong>Loading assignments...</strong>

                          <p>
                            Fetching complaints from the server.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredComplaints.length > 0 ? (
                    filteredComplaints.map((complaint) => {
                      const id = getComplaintId(complaint)

                      return (
                        <tr
                          key={
                            id || getComplaintReference(complaint)
                          }
                        >
                          <td>
                            <div className="staff-complaint-cell">
                              <span className="staff-complaint-icon">
                                <ClipboardList size={19} />
                              </span>

                              <div>
                                <strong>
                                  {complaint.title ||
                                    'Untitled complaint'}
                                </strong>

                                <span>
                                  {getComplaintReference(complaint)}
                                  {' · '}
                                  {complaint.category || 'Other'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="staff-location">
                              <MapPin size={14} />

                              {complaint.location ||
                                'Not specified'}
                            </span>
                          </td>

                          <td>
                            <PriorityBadge
                              priority={complaint.priority}
                            />
                          </td>

                          <td>
                            <StatusBadge
                              status={complaint.status}
                            />
                          </td>

                          <td>
                            <span className="staff-date">
                              <CalendarDays size={14} />

                              {formatDate(
                                complaint.assignedAt ||
                                complaint.createdAt
                              )}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="staff-view-button"
                              disabled={!id}
                              onClick={() => {
                                if (!id) return

                                navigate(
                                  `/staff/complaints/${encodeURIComponent(id)}`
                                )
                              }}
                            >
                              <Eye size={15} />
                              View
                              <ArrowRight size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="staff-empty-state">
                          <ClipboardList size={30} />

                          <strong>
                            {error
                              ? 'Assignments unavailable'
                              : complaints.length === 0
                                ? 'No assignments yet'
                                : 'No matching complaints'}
                          </strong>

                          <p>
                            {error
                              ? 'Check your login session and backend server, then try again.'
                              : complaints.length === 0
                                ? 'Complaints assigned to your staff account will appear here.'
                                : 'Try another search term or status filter.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="staff-table-footer">
              <span>
                Showing {filteredComplaints.length} of{' '}
                {complaints.length} assignments
              </span>

              <span>CampusFix · Staff workspace</span>
            </footer>
          </section>

          {/* Information note */}

          <div className="staff-info-note">
            <AlertTriangle size={18} />

            <p>
              <strong>Live backend data:</strong> Assignments are
              requested from the FixMyCampus API. Only complaints
              returned by the logged-in staff account are displayed.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}