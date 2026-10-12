// CampusFix — Backend-integrated Admin Dashboard.

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  LayoutDashboard,
  ClipboardList,
  Clock3,
  CheckCircle2,
  CircleDot,
  Users,
  Search,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  CalendarDays,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Activity,
  Eye,
  Filter,
  Leaf,
  UserCheck,
  UserX,
  RefreshCw,
  Lightbulb,
} from 'lucide-react'

import {
  getAllComplaints,
  getPendingStaff,
  approveStaff,
  rejectStaff,
} from '../../services/adminService.js'

import './AdminDashboard.css'

/* ---------------------------------------
   NAVIGATION
--------------------------------------- */

const navigationItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Complaints', icon: ClipboardList },
  { label: 'Staff Management', icon: Users },
  { label: 'Suggestions', icon: Lightbulb },
]

/* ---------------------------------------
   COMPLAINT HELPERS
--------------------------------------- */

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
    value.includes('resolved') ||
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
  const value = String(priority || '').trim().toLowerCase()

  if (value === 'high' || value === 'urgent') {
    return 'High'
  }

  if (value === 'low') {
    return 'Low'
  }

  return 'Medium'
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

function mapBackendComplaint(item) {
  const student =
    typeof item.student === 'object' && item.student !== null
      ? item.student.name || item.student.email || 'Student'
      : item.student || 'Student'

  return {
    ...item,

    id: item._id || item.id || item.complaintId,

    complaintId:
      item.complaintId || item._id || item.id || 'N/A',

    title: item.title || 'Untitled complaint',

    category: item.category || 'Other',

    location: item.location || 'Not specified',

    priority: normalizePriority(item.priority),

    status: normalizeStatus(item.status),

    student:
      typeof student === 'string'
        ? student
        : 'Student',

    createdAt: item.createdAt || null,
  }
}

/* ---------------------------------------
   BADGES
--------------------------------------- */

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status)

  const className = normalized
    .toLowerCase()
    .replace(/\s+/g, '-')

  return (
    <span className={`admin-status admin-status-${className}`}>
      <span className="admin-status-dot" />
      {normalized}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const normalized = normalizePriority(priority)

  return (
    <span
      className={`admin-priority admin-priority-${normalized.toLowerCase()}`}
    >
      {normalized === 'High' && (
        <AlertTriangle size={13} />
      )}

      {normalized}
    </span>
  )
}

/* ---------------------------------------
   STATISTICS CARD
--------------------------------------- */

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
  tone,
}) {
  return (
    <article className={`admin-stat-card admin-stat-${tone}`}>
      <div className="admin-stat-top">
        <span>{title}</span>

        <span className="admin-stat-icon">
          <Icon size={21} strokeWidth={1.9} />
        </span>
      </div>

      <div className="admin-stat-value">
        {value}
      </div>

      <div className="admin-stat-caption">
        <TrendingUp size={14} />
        <span>{caption}</span>
      </div>
    </article>
  )
}

/* =======================================
   MAIN COMPONENT
======================================= */

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [activeNavigation, setActiveNavigation] =
    useState('Overview')

  const [activeFilter, setActiveFilter] =
    useState('All')

  const [searchTerm, setSearchTerm] =
    useState('')

  /* Complaints */

  const [complaints, setComplaints] =
    useState([])

  const [complaintLoading, setComplaintLoading] =
    useState(true)

  const [complaintError, setComplaintError] =
    useState('')

  /* Staff approval */

  const [pendingStaff, setPendingStaff] =
    useState([])

  const [staffLoading, setStaffLoading] =
    useState(true)

  const [staffError, setStaffError] =
    useState('')

  const [staffMessage, setStaffMessage] =
    useState('')

  const [processingStaffId, setProcessingStaffId] =
    useState('')

  /* ---------------------------------------
     LOAD COMPLAINTS FROM BACKEND
  --------------------------------------- */

  const loadComplaints = useCallback(async (
    showLoading = true
  ) => {
    if (showLoading) {
      setComplaintLoading(true)
    }

    setComplaintError('')

    try {
      const response = await getAllComplaints()

      const backendComplaints = Array.isArray(
        response?.complaints
      )
        ? response.complaints
        : []

      const mappedComplaints =
        backendComplaints.map(mapBackendComplaint)

      setComplaints(mappedComplaints)
    } catch (error) {
      console.error(
        'Admin complaint loading error:',
        error
      )

      setComplaintError(
        error.message ||
          'Unable to load complaints from the server.'
      )
    } finally {
      if (showLoading) {
        setComplaintLoading(false)
      }
    }
  }, [])

  /* ---------------------------------------
     LOAD PENDING STAFF
  --------------------------------------- */

  const loadPendingStaff = useCallback(async () => {
    setStaffLoading(true)
    setStaffError('')

    try {
      const response = await getPendingStaff()

      setPendingStaff(
        Array.isArray(response?.staff)
          ? response.staff
          : []
      )
    } catch (error) {
      console.error(
        'Pending staff loading error:',
        error
      )

      setStaffError(
        error.message ||
          'Unable to load pending staff registrations.'
      )
    } finally {
      setStaffLoading(false)
    }
  }, [])

  /* ---------------------------------------
     INITIAL DATA LOAD
  --------------------------------------- */

  useEffect(() => {
    loadComplaints()
    loadPendingStaff()
  }, [loadComplaints, loadPendingStaff])

  /* ---------------------------------------
     REFRESH BOTH SECTIONS
  --------------------------------------- */

  async function refreshDashboard() {
    await Promise.all([
      loadComplaints(),
      loadPendingStaff(),
    ])
  }

  /* ---------------------------------------
     COMPLAINT STATISTICS
  --------------------------------------- */

  const counts = useMemo(() => {
    return {
      total: complaints.length,

      pending: complaints.filter(
        (item) =>
          normalizeStatus(item.status) === 'Pending'
      ).length,

      progress: complaints.filter(
        (item) =>
          normalizeStatus(item.status) === 'In Progress'
      ).length,

      resolved: complaints.filter(
        (item) =>
          normalizeStatus(item.status) ===
            'Awaiting Confirmation' ||
          normalizeStatus(item.status) === 'Closed'
      ).length,
    }
  }, [complaints])

  /* ---------------------------------------
     SEARCH AND FILTER
  --------------------------------------- */

  const filteredComplaints = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return complaints.filter((complaint) => {
      const status = normalizeStatus(
        complaint.status
      )

      const matchesFilter =
        activeFilter === 'All' ||
        status === activeFilter ||
        (
          activeFilter === 'Resolved' &&
          (
            status === 'Awaiting Confirmation' ||
            status === 'Closed'
          )
        )

      const matchesSearch =
        !query ||
        [
          complaint.complaintId,
          complaint.id,
          complaint.title,
          complaint.category,
          complaint.location,
          complaint.student,
        ].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(query)
        )

      return matchesFilter && matchesSearch
    })
  }, [complaints, activeFilter, searchTerm])

  /* ---------------------------------------
     STAFF APPROVE / REJECT
  --------------------------------------- */

  async function handleStaffApproval(
    staffId,
    action
  ) {
    const staff = pendingStaff.find(
      (item) =>
        String(item._id || item.id) ===
        String(staffId)
    )

    const staffName =
      staff?.name || 'this staff member'

    const confirmed = window.confirm(
      action === 'approve'
        ? `Approve ${staffName}'s registration?`
        : `Reject ${staffName}'s registration?`
    )

    if (!confirmed) return

    setProcessingStaffId(staffId)
    setStaffError('')
    setStaffMessage('')

    try {
      const response =
        action === 'approve'
          ? await approveStaff(staffId)
          : await rejectStaff(staffId)

      setStaffMessage(
        response?.message ||
          (
            action === 'approve'
              ? 'Staff registration approved successfully.'
              : 'Staff registration rejected successfully.'
          )
      )

      await loadPendingStaff()
    } catch (error) {
      setStaffError(
        error.message ||
          'Unable to update staff registration.'
      )
    } finally {
      setProcessingStaffId('')
    }
  }

  /* ---------------------------------------
     NAVIGATION
  --------------------------------------- */

  function handleNavigation(label) {
  setActiveNavigation(label)

  if (label === 'Complaints') {
    navigate('/admin/complaints')
  }

  if (label === 'Staff Management') {
    navigate('/admin/staff')
  }

  if (label === 'Suggestions') {
    navigate('/admin/suggestions')
  }
}

  /* ---------------------------------------
     LOGOUT
  --------------------------------------- */

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentUser')

    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('currentUser')

    navigate('/login')
  }

  /* ---------------------------------------
     PRIORITY COUNTS
  --------------------------------------- */

  const priorityCounts = useMemo(() => {
    return {
      High: complaints.filter(
        (item) => normalizePriority(item.priority) === 'High'
      ).length,

      Medium: complaints.filter(
        (item) => normalizePriority(item.priority) === 'Medium'
      ).length,

      Low: complaints.filter(
        (item) => normalizePriority(item.priority) === 'Low'
      ).length,
    }
  }, [complaints])

  /* =======================================
     RENDER
  ======================================= */

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">
            <Leaf size={23} />
          </span>

          <span>
            Campus<span>Fix</span>
          </span>
        </div>

        <div className="admin-sidebar-label">
          ADMINISTRATION
        </div>

        <nav className="admin-navigation">
          {navigationItems.map(
            ({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className={`admin-nav-item ${
                  activeNavigation === label
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleNavigation(label)
                }
              >
                <Icon size={19} />

                <span>{label}</span>

                {label === 'Complaints' && (
                  <span className="admin-nav-count">
                    {counts.pending}
                  </span>
                )}

                {label === 'Staff Management' &&
                  pendingStaff.length > 0 && (
                    <span className="admin-nav-count">
                      {pendingStaff.length}
                    </span>
                  )}
              </button>
            )
          )}
        </nav>

        <div className="admin-sidebar-spacer" />

        <div className="admin-sidebar-message">
          <span className="admin-message-icon">
            <Leaf size={19} />
          </span>

          <h3>Better campus, together.</h3>

          <p>
            Every resolved issue brings us one step
            closer to a better campus.
          </p>
        </div>

        <div className="admin-sidebar-profile">
          <div className="admin-avatar">A</div>

          <div className="admin-profile-copy">
            <strong>Campus Admin</strong>
            <span>Administrator</span>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
            title="Log out"
          >
            <ArrowUpRight size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-eyebrow">
              CAMPUSFIX / ADMINISTRATION
            </span>

            <h1>Admin Dashboard</h1>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-live-indicator">
              <span />
              Live backend data
            </div>

            <div className="admin-topbar-avatar">
              A
            </div>

            <div className="admin-topbar-user">
              <strong>Administrator</strong>
              <span>Campus Management</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {/* WELCOME BANNER */}

          <section className="admin-welcome-banner">
            <div className="admin-welcome-copy">
              <span className="admin-welcome-eyebrow">
                <Activity size={15} />
                CAMPUS OPERATIONS
              </span>

              <h2>Welcome back, Admin.</h2>

              <p>
                Review reported issues, coordinate your
                campus team, and keep every complaint
                moving toward resolution.
              </p>

              <button
                type="button"
                className="admin-welcome-button"
                onClick={() =>
                  navigate('/admin/complaints')
                }
              >
                Review Complaints
                <ArrowRight size={17} />
              </button>
            </div>

            <div className="admin-welcome-art">
              <div className="admin-art-circle admin-art-circle-one" />
              <div className="admin-art-circle admin-art-circle-two" />

              <div className="admin-art-icon">
                <ClipboardList size={43} />
              </div>

              <span className="admin-art-leaf">
                <Leaf size={22} />
              </span>
            </div>
          </section>

          {/* STATISTICS */}

          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <span className="admin-section-eyebrow">
                  AT A GLANCE
                </span>

                <h2>Campus Overview</h2>
              </div>

              <button
                type="button"
                className="admin-outline-button"
                onClick={refreshDashboard}
                disabled={complaintLoading}
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            {complaintError && (
              <div
                className="admin-staff-error"
                role="alert"
              >
                <span>{complaintError}</span>

                <button
                  type="button"
                  onClick={() => loadComplaints()}
                >
                  Retry
                </button>
              </div>
            )}

            <div className="admin-stats-grid">
              <StatCard
                title="Total Complaints"
                value={
                  complaintLoading
                    ? '...'
                    : counts.total
                }
                caption="All reported issues"
                icon={ClipboardList}
                tone="total"
              />

              <StatCard
                title="Pending"
                value={
                  complaintLoading
                    ? '...'
                    : counts.pending
                }
                caption="Awaiting assignment"
                icon={Clock3}
                tone="pending"
              />

              <StatCard
                title="In Progress"
                value={
                  complaintLoading
                    ? '...'
                    : counts.progress
                }
                caption="Work underway"
                icon={Wrench}
                tone="progress"
              />

              <StatCard
                title="Resolved"
                value={
                  complaintLoading
                    ? '...'
                    : counts.resolved
                }
                caption="Awaiting confirmation or closed"
                icon={CheckCircle2}
                tone="resolved"
              />
            </div>
          </section>

          {/* PENDING STAFF APPROVAL */}

          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <span className="admin-section-eyebrow">
                  STAFF MANAGEMENT
                </span>

                <h2>Pending Staff Approvals</h2>

                <p>
                  Review staff registrations and approve
                  or reject their requests.
                </p>
              </div>

              <button
                type="button"
                className="admin-outline-button"
                onClick={loadPendingStaff}
                disabled={staffLoading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="admin-pending-count">
              <Users size={19} />

              <span>Waiting for approval</span>

              <strong>{pendingStaff.length}</strong>
            </div>

            {staffMessage && (
              <div
                className="admin-staff-success"
                role="status"
              >
                {staffMessage}
              </div>
            )}

            {staffError && (
              <div
                className="admin-staff-error"
                role="alert"
              >
                {staffError}
              </div>
            )}

            {staffLoading ? (
              <div className="admin-staff-empty">
                Loading staff registrations...
              </div>
            ) : pendingStaff.length === 0 ? (
              <div className="admin-staff-empty">
                <CheckCircle2 size={28} />

                <strong>
                  No pending registrations
                </strong>

                <span>
                  New staff registrations waiting for
                  approval will appear here.
                </span>
              </div>
            ) : (
              <div className="admin-pending-staff-list">
                {pendingStaff.map((staff) => {
                  const staffId =
                    staff._id || staff.id

                  const isProcessing =
                    processingStaffId === staffId

                  return (
                    <article
                      className="admin-pending-staff-card"
                      key={staffId}
                    >
                      <div className="admin-pending-staff-avatar">
                        {staff.name
                          ?.charAt(0)
                          ?.toUpperCase() || 'S'}
                      </div>

                      <div className="admin-pending-staff-info">
                        <strong>{staff.name}</strong>

                        <span>{staff.email}</span>

                        <span>
                          Department:{' '}
                          {staff.department || 'Not specified'}
                        </span>

                        <span className="admin-pending-badge">
                          Pending approval
                        </span>
                      </div>

                      <div className="admin-pending-staff-actions">
                        <button
                          type="button"
                          className="admin-approve-button"
                          disabled={
                            Boolean(processingStaffId)
                          }
                          onClick={() =>
                            handleStaffApproval(
                              staffId,
                              'approve'
                            )
                          }
                        >
                          <UserCheck size={16} />

                          {isProcessing
                            ? 'Processing...'
                            : 'Approve'}
                        </button>

                        <button
                          type="button"
                          className="admin-reject-button"
                          disabled={
                            Boolean(processingStaffId)
                          }
                          onClick={() =>
                            handleStaffApproval(
                              staffId,
                              'reject'
                            )
                          }
                        >
                          <UserX size={16} />

                          {isProcessing
                            ? 'Processing...'
                            : 'Reject'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* COMPLAINT MANAGEMENT */}

          <section className="admin-section admin-complaints-section">
            <div className="admin-section-heading admin-complaints-heading">
              <div>
                <span className="admin-section-eyebrow">
                  REVIEW & COORDINATE
                </span>

                <h2>Complaint Management</h2>

                <p>
                  Monitor incoming reports and identify
                  issues that need attention.
                </p>
              </div>

              <button
                type="button"
                className="admin-outline-button"
                onClick={() =>
                  navigate('/admin/complaints')
                }
              >
                View All
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="admin-complaint-toolbar">
              <label className="admin-search">
                <Search size={18} />

                <input
                  type="search"
                  placeholder="Search ID, title, category or location..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </label>

              <div className="admin-filter-label">
                <Filter size={16} />
                Filter
              </div>
            </div>

            <div className="admin-filter-tabs">
              {[
                'All',
                'Pending',
                'In Progress',
                'Resolved',
              ].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`admin-filter-tab ${
                    activeFilter === filter
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setActiveFilter(filter)
                  }
                >
                  {filter}

                  <span>
                    {filter === 'All'
                      ? counts.total
                      : filter === 'Pending'
                        ? counts.pending
                        : filter === 'In Progress'
                          ? counts.progress
                          : counts.resolved}
                  </span>
                </button>
              ))}
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-complaints-table">
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {complaintLoading ? (
                    <tr>
                      <td colSpan="6">
                        <div className="admin-empty-state">
                          <RefreshCw size={24} />
                          <strong>
                            Loading complaints...
                          </strong>
                        </div>
                      </td>
                    </tr>
                  ) : filteredComplaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td>
                        <div className="admin-table-complaint">
                          <span className="admin-table-icon">
                            <ClipboardList size={19} />
                          </span>

                          <div>
                            <strong>
                              {complaint.title}
                            </strong>

                            <span>
                              {complaint.complaintId} ·{' '}
                              {complaint.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-table-location">
                          <MapPin size={14} />
                          {complaint.location}
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
                        <span className="admin-table-date">
                          <CalendarDays size={14} />
                          {formatDate(complaint.createdAt)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-view-button"
                          title="View complaint"
                          onClick={() =>
                            navigate(
                              `/admin/complaints`
                            )
                          }
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!complaintLoading &&
                    !complaintError &&
                    filteredComplaints.length === 0 && (
                      <tr>
                        <td colSpan="6">
                          <div className="admin-empty-state">
                            <Search size={25} />

                            <strong>
                              No complaints found
                            </strong>

                            <span>
                              {searchTerm ||
                              activeFilter !== 'All'
                                ? 'Try another search term or status filter.'
                                : 'No complaints have been submitted yet.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            <div className="admin-table-footer">
              <span>
                Showing {filteredComplaints.length} of{' '}
                {counts.total} complaints
              </span>

              <span>Live backend data</span>
            </div>
          </section>

          {/* BOTTOM CARDS */}

          <section className="admin-bottom-grid">
            <article className="admin-bottom-card admin-priority-summary">
              <div className="admin-bottom-card-heading">
                <span className="admin-bottom-icon admin-icon-amber">
                  <AlertTriangle size={20} />
                </span>

                <div>
                  <h3>Priority Overview</h3>
                  <p>Complaints needing attention</p>
                </div>
              </div>

              {['High', 'Medium', 'Low'].map(
                (priority) => {
                  const count = priorityCounts[priority]

                  return (
                    <div
                      className="admin-priority-row"
                      key={priority}
                    >
                      <PriorityBadge priority={priority} />

                      <div className="admin-priority-track">
                        <span
                          className={`admin-priority-bar priority-bar-${priority.toLowerCase()}`}
                          style={{
                            width: `${
                              (count /
                                Math.max(counts.total, 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>

                      <strong>{count}</strong>
                    </div>
                  )
                }
              )}
            </article>

            <article className="admin-bottom-card admin-staff-summary">
              <div className="admin-bottom-card-heading">
                <span className="admin-bottom-icon admin-icon-green">
                  <Users size={20} />
                </span>

                <div>
                  <h3>Staff Management</h3>
                  <p>
                    Coordinate maintenance personnel
                  </p>
                </div>
              </div>

              <div className="admin-staff-summary-content">
                <div className="admin-staff-number">
                  <strong>{pendingStaff.length}</strong>
                  <span>Pending registrations</span>
                </div>

                <button
                  type="button"
                  className="admin-staff-link"
                  onClick={() =>
                    navigate('/admin/staff')
                  }
                >
                  Open Staff Management
                  <ArrowUpRight size={17} />
                </button>
              </div>

              <p className="admin-demo-explanation">
                Approve staff registrations before
                assigning complaints to them.
              </p>
            </article>
          </section>

          {/* FOOTER */}

          <footer className="admin-footer-note">
            <CircleDot size={18} />

            <p>
              <strong>Note:</strong> Complaint and staff
              approval data are fetched from the backend.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}