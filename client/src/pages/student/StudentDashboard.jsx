import { useEffect, useState } from 'react'
import {
  ClipboardList,
  Clock3,
  LoaderCircle,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  MapPin,
  CalendarDays,
  FileText,
  RefreshCw,
} from 'lucide-react'

import MainLayout from '../../components/layout/MainLayout'
import StatCard from '../../components/dashboard/StatCard'
import { getMyComplaints } from '../../services/complaintService'
import './StudentDashboard.css'

const filters = ['All', 'Pending', 'In Progress', 'Resolved']

function getLoggedInUser() {
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

function getStatus(complaint) {
  return String(complaint.status || 'Pending').trim()
}

function normalizeStatus(status) {
  const value = String(status || '').toLowerCase().trim()

  if (value === 'pending') return 'Pending'
  if (value === 'assigned') return 'Pending'
  if (value === 'in progress' || value === 'in-progress') {
    return 'In Progress'
  }
  if (value === 'awaiting confirmation') return 'Awaiting Confirmation'
  if (value === 'closed' || value === 'resolved') return 'Resolved'

  return status || 'Pending'
}

function formatDate(dateValue) {
  if (!dateValue) return 'Date unavailable'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getComplaintId(complaint) {
  return complaint.complaintId || complaint._id || complaint.id
}

function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status)
  const statusClass = normalizedStatus.toLowerCase().replace(/\s+/g, '-')

  return (
    <span className={`student-status student-status--${statusClass}`}>
      <span className="student-status-dot" />
      {normalizedStatus}
    </span>
  )
}

export default function StudentDashboard() {
  const user = getLoggedInUser()

  const [activeFilter, setActiveFilter] = useState('All')
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadComplaints() {
      setLoading(true)
      setError('')

      try {
        const response = await getMyComplaints()

        if (cancelled) return

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.complaints)
            ? response.complaints
            : Array.isArray(response?.data?.complaints)
              ? response.data.complaints
              : []

        setComplaints(data)
      } catch (err) {
        if (cancelled) return

        console.error('Unable to load student complaints:', err)
        setError(
          err.message ||
            'Unable to load your complaints. Please try again.'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadComplaints()

    return () => {
      cancelled = true
    }
  }, [])

  const stats = [
    {
      title: 'Total Complaints',
      value: String(complaints.length).padStart(2, '0'),
      description: 'All your reported issues',
      icon: ClipboardList,
      color: 'green',
    },
    {
      title: 'Pending',
      value: String(
        complaints.filter((complaint) => {
          const status = normalizeStatus(getStatus(complaint))
          return status === 'Pending'
        }).length
      ).padStart(2, '0'),
      description: 'Waiting for action',
      icon: Clock3,
      color: 'amber',
    },
    {
      title: 'In Progress',
      value: String(
        complaints.filter((complaint) => {
          const status = normalizeStatus(getStatus(complaint))
          return status === 'In Progress'
        }).length
      ).padStart(2, '0'),
      description: 'Currently being resolved',
      icon: LoaderCircle,
      color: 'blue',
    },
    {
      title: 'Resolved',
      value: String(
        complaints.filter((complaint) => {
          const status = normalizeStatus(getStatus(complaint))
          return status === 'Resolved'
        }).length
      ).padStart(2, '0'),
      description: 'Successfully completed',
      icon: CheckCircle2,
      color: 'sage',
    },
  ]

  const filteredComplaints =
    activeFilter === 'All'
      ? complaints
      : complaints.filter(
          (complaint) =>
            normalizeStatus(getStatus(complaint)) === activeFilter
        )

  // Display the newest complaints first.
  const recentComplaints = [...filteredComplaints]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 5)

  const displayName = user?.name?.trim() || 'Student'

  return (
    <MainLayout>
      <div className="student-dashboard">
        {/* WELCOME */}
        <section className="student-welcome">
          <div>
            <span className="student-eyebrow">STUDENT DASHBOARD</span>

            <h1>
              Good evening, <span>{displayName}!</span>
            </h1>

            <p>
              Here's what's happening with your campus complaints.
            </p>
          </div>

          <a
            href="/student/complaints/new"
            className="student-primary-button"
          >
            <Plus size={19} />
            Report an issue
          </a>
        </section>

        {/* STATISTICS */}
        <section
          className="student-stats-grid"
          aria-label="Complaint statistics"
        >
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </section>

        {/* RECENT COMPLAINTS HEADING */}
        <section className="student-dashboard-heading">
          <div>
            <h2>Your recent complaints</h2>
            <p>Keep track of the issues you've reported.</p>
          </div>

          <a href="/student/complaints" className="student-text-link">
            View all <ArrowUpRight size={17} />
          </a>
        </section>

        {/* COMPLAINTS PANEL */}
        <section className="student-complaints-panel">
          <div className="student-complaints-toolbar">
            <div className="student-filter-list">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`student-filter ${
                    activeFilter === filter ? 'is-active' : ''
                  }`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <span className="student-complaint-count">
              {loading ? 'Loading...' : `${filteredComplaints.length} complaints`}
            </span>
          </div>

          <div className="student-complaint-list">
            {loading ? (
              <div className="student-empty-state">
                <LoaderCircle size={28} className="animate-spin" />
                <h3>Loading your complaints...</h3>
                <p>Please wait while we retrieve your data.</p>
              </div>
            ) : error ? (
              <div className="student-empty-state">
                <ClipboardList size={28} />
                <h3>Could not load complaints</h3>
                <p>{error}</p>

                <button
                  type="button"
                  className="student-primary-button"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : recentComplaints.length > 0 ? (
              recentComplaints.map((complaint) => (
                <article
                  className="student-complaint-item"
                  key={getComplaintId(complaint)}
                >
                  <div className="student-complaint-icon">
                    <FileText size={21} />
                  </div>

                  <div className="student-complaint-info">
                    <span className="student-complaint-id">
                      {complaint.complaintId ||
                        `CMP-${String(complaint._id || '').slice(-6).toUpperCase()}`}
                    </span>

                    <h3>{complaint.title || 'Untitled complaint'}</h3>

                    <div className="student-complaint-meta">
                      <span>
                        <MapPin size={14} />
                        {complaint.location || 'Location not specified'}
                      </span>

                      <span>
                        <CalendarDays size={14} />
                        {formatDate(complaint.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="student-complaint-right">
                    <StatusBadge status={getStatus(complaint)} />

                    <span className="student-complaint-category">
                      {complaint.category || 'General'}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="student-empty-state">
                <ClipboardList size={28} />

                <h3>
                  {activeFilter === 'All'
                    ? 'No complaints yet'
                    : `No ${activeFilter.toLowerCase()} complaints`}
                </h3>

                <p>
                  {activeFilter === 'All'
                    ? 'You have not reported any campus issues yet. Create your first complaint to see it here.'
                    : 'There are no complaints under this status yet.'}
                </p>

                {activeFilter === 'All' && (
                  <a
                    href="/student/complaints/new"
                    className="student-primary-button"
                  >
                    <Plus size={17} />
                    Report your first issue
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* HELP BANNER */}
        <section className="student-help-banner">
          <div className="student-help-icon">
            <CheckCircle2 size={24} />
          </div>

          <div>
            <h3>Let's make your campus better.</h3>

            <p>
              Noticed something that needs attention? Let your campus team know.
            </p>
          </div>

          <a
            href="/student/complaints/new"
            className="student-help-link"
          >
            Report now <ArrowUpRight size={17} />
          </a>
        </section>

        <p className="student-dashboard-footer">
          Small actions. Meaningful change.
        </p>
      </div>
    </MainLayout>
  )
}