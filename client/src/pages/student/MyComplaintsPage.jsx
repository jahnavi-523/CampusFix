// Student complaint list connected to the backend API.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Plus,
  Search,
  FileText,
  Clock3,
  CheckCircle2,
  CircleDot,
  MapPin,
  CalendarDays,
  ArrowRight,
  ClipboardList,
  Inbox,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import MainLayout from '../../components/layout/MainLayout'
import { getMyComplaints } from '../../services/complaintService.js'

import './MyComplaintsPage.css'

/* ---------------------------------------
   Formatting helpers
--------------------------------------- */

function formatDate(dateString) {
  if (!dateString) return 'Date unavailable'

  const date = new Date(dateString)

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
   Status helpers
--------------------------------------- */

function normalizeStatus(status) {
  const value = String(status || 'Pending')
    .trim()
    .toLowerCase()

  if (
    value === 'closed' ||
    value === 'resolved' ||
    value === 'completed' ||
    value === 'confirmed' ||
    value === 'student confirmed'
  ) {
    return 'Resolved'
  }

  if (
    value.includes('awaiting confirmation') ||
    value.includes('pending confirmation')
  ) {
    return 'Awaiting Confirmation'
  }

  if (
    value.includes('in progress') ||
    value.includes('working') ||
    value.includes('in-progress') ||
    value.includes('in review') ||
    value.includes('under review')
  ) {
    return 'In Progress'
  }

  if (
    value.includes('assigned') ||
    value.includes('accepted')
  ) {
    return 'Assigned'
  }

  return 'Pending'
}

function getStatusClass(status) {
  const normalized = normalizeStatus(status)

  if (normalized === 'Resolved') {
    return 'resolved'
  }

  if (
    normalized === 'In Progress' ||
    normalized === 'Assigned' ||
    normalized === 'Awaiting Confirmation'
  ) {
    return 'in-progress'
  }

  return 'pending'
}

function normalizePriority(priority) {
  const value = String(priority || 'Medium').trim().toLowerCase()

  if (value === 'low') return 'Low'
  if (value === 'high') return 'High'
  if (value === 'urgent') return 'Urgent'

  return 'Medium'
}

/* ---------------------------------------
   Status badge
--------------------------------------- */

function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status)
  const statusClass = getStatusClass(status)

  const StatusIcon =
    statusClass === 'resolved'
      ? CheckCircle2
      : statusClass === 'in-progress'
        ? CircleDot
        : Clock3

  return (
    <span className={`my-complaint-status status-${statusClass}`}>
      <StatusIcon size={14} />
      {normalizedStatus}
    </span>
  )
}

/* ---------------------------------------
   Main component
--------------------------------------- */

export default function MyComplaintsPage() {
  const navigate = useNavigate()

  const [complaints, setComplaints] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  /* ---------------------------------------
     Fetch complaints from backend
  --------------------------------------- */

  async function fetchComplaints() {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await getMyComplaints()

      const records =
        response?.complaints ||
        response?.data?.complaints ||
        []

      if (!Array.isArray(records)) {
        throw new Error('Invalid complaints response from server.')
      }

      const formattedComplaints = records.map((item) => ({
        ...item,

        // MongoDB uses _id; the UI uses id for navigation.
        id: String(item._id || item.id || ''),

        // Keep the backend status unchanged.
        status: item.status || 'Pending',

        priority: normalizePriority(item.priority),
      }))

      setComplaints(formattedComplaints)
    } catch (error) {
      console.error('Fetch complaints error:', error)

      setErrorMessage(
        error.message || 'Unable to load your complaints.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  /* ---------------------------------------
     Statistics
  --------------------------------------- */

  const counts = {
    All: complaints.length,

    Pending: complaints.filter(
      (complaint) =>
        getStatusClass(complaint.status) === 'pending'
    ).length,

    'In Progress': complaints.filter(
      (complaint) =>
        getStatusClass(complaint.status) === 'in-progress'
    ).length,

    Resolved: complaints.filter(
      (complaint) =>
        getStatusClass(complaint.status) === 'resolved'
    ).length,
  }

  /* ---------------------------------------
     Search and filters
  --------------------------------------- */

  const filteredComplaints = complaints.filter((complaint) => {
    const statusClass = getStatusClass(complaint.status)

    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Pending' &&
        statusClass === 'pending') ||
      (activeFilter === 'In Progress' &&
        statusClass === 'in-progress') ||
      (activeFilter === 'Resolved' &&
        statusClass === 'resolved')

    const query = searchTerm.trim().toLowerCase()

    const searchableValues = [
      complaint.title,
      complaint.complaintId,
      complaint.id,
      complaint.category,
      complaint.location,
      complaint.description,
      complaint.priority,
      complaint.status,
    ]

    const matchesSearch =
      !query ||
      searchableValues.some((value) =>
        String(value || '').toLowerCase().includes(query)
      )

    return matchesFilter && matchesSearch
  })

  /* ---------------------------------------
     Open complaint details
  --------------------------------------- */

  function openComplaintDetails(complaint) {
    if (!complaint.id) {
      window.alert(
        'This complaint does not have a valid reference ID.'
      )
      return
    }

    navigate(
      `/student/complaints/${encodeURIComponent(complaint.id)}`
    )
  }

  /* ---------------------------------------
     Render
  --------------------------------------- */

  return (
    <MainLayout>
      <div className="my-complaints-page">
        {/* PAGE HEADER */}

        <header className="my-complaints-heading">
          <div>
            <span className="my-complaints-eyebrow">
              <ClipboardList size={15} />
              COMPLAINT MANAGEMENT
            </span>

            <h1>My Complaints</h1>

            <p>
              Track your reported issues and stay updated on their
              progress.
            </p>
          </div>

          <button
            className="my-complaints-create-button"
            type="button"
            onClick={() => navigate('/student/complaints/new')}
          >
            <Plus size={18} />
            Report an Issue
          </button>
        </header>

        {/* STATISTICS */}

        <section
          className="my-complaints-stats"
          aria-label="Complaint statistics"
        >
          <article className="my-complaints-stat">
            <span className="my-complaints-stat-icon stat-total">
              <FileText size={20} />
            </span>

            <div>
              <p>Total Complaints</p>
              <strong>{counts.All}</strong>
            </div>
          </article>

          <article className="my-complaints-stat">
            <span className="my-complaints-stat-icon stat-pending">
              <Clock3 size={20} />
            </span>

            <div>
              <p>Pending</p>
              <strong>{counts.Pending}</strong>
            </div>
          </article>

          <article className="my-complaints-stat">
            <span className="my-complaints-stat-icon stat-progress">
              <CircleDot size={20} />
            </span>

            <div>
              <p>In Progress</p>
              <strong>{counts['In Progress']}</strong>
            </div>
          </article>

          <article className="my-complaints-stat">
            <span className="my-complaints-stat-icon stat-resolved">
              <CheckCircle2 size={20} />
            </span>

            <div>
              <p>Resolved</p>
              <strong>{counts.Resolved}</strong>
            </div>
          </article>
        </section>

        {/* COMPLAINT LIST */}

        <section className="my-complaints-content">
          <div className="my-complaints-toolbar">
            <div>
              <h2>All Reported Issues</h2>

              <p>
                {isLoading
                  ? 'Loading complaints...'
                  : `${filteredComplaints.length} ${
                      filteredComplaints.length === 1
                        ? 'complaint'
                        : 'complaints'
                    } found`}
              </p>
            </div>

            <label className="my-complaints-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                aria-label="Search complaints"
                disabled={isLoading || Boolean(errorMessage)}
              />
            </label>
          </div>

          {/* STATUS FILTERS */}

          <div className="my-complaints-filters">
            <span className="my-complaints-filter-icon">
              <SlidersHorizontal size={15} />
              Filter:
            </span>

            {['All', 'Pending', 'In Progress', 'Resolved'].map(
              (filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`my-complaints-filter ${
                    activeFilter === filter ? 'active' : ''
                  }`}
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={activeFilter === filter}
                  disabled={isLoading || Boolean(errorMessage)}
                >
                  {filter}
                  <span>{counts[filter]}</span>
                </button>
              )
            )}
          </div>

          {/* LOADING STATE */}

          {isLoading ? (
            <div className="my-complaints-empty">
              <RefreshCw size={30} className="animate-spin" />

              <h3>Loading your complaints...</h3>

              <p>
                Please wait while we retrieve your complaints from
                the server.
              </p>
            </div>
          ) : errorMessage ? (
            /* ERROR STATE */

            <div className="my-complaints-empty">
              <AlertCircle size={32} />

              <h3>Unable to load complaints</h3>

              <p>{errorMessage}</p>

              <button
                type="button"
                className="my-complaints-create-button"
                onClick={fetchComplaints}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          ) : filteredComplaints.length > 0 ? (
            /* COMPLAINT CARDS */

            <div className="my-complaints-list">
              {filteredComplaints.map((complaint, index) => (
                <article
                  className="my-complaint-card"
                  key={
                    complaint.id ||
                    `${complaint.title || 'complaint'}-${index}`
                  }
                >
                  <div className="my-complaint-card-main">
                    <div className="my-complaint-file-icon">
                      <FileText size={22} />
                    </div>

                    <div className="my-complaint-details">
                      <div className="my-complaint-card-topline">
                        <span className="my-complaint-id">
                          {complaint.complaintId ||
                            complaint.id ||
                            'ID unavailable'}
                        </span>

                        <StatusBadge status={complaint.status} />
                      </div>

                      <h3>
                        {complaint.title || 'Untitled complaint'}
                      </h3>

                      {complaint.description && (
                        <p className="my-complaint-description">
                          {complaint.description}
                        </p>
                      )}

                      <div className="my-complaint-metadata">
                        <span>
                          <ClipboardList size={14} />
                          {complaint.category || 'Other'}
                        </span>

                        <span>
                          <MapPin size={14} />
                          {complaint.location ||
                            'Location unavailable'}
                        </span>

                        <span>
                          <CalendarDays size={14} />
                          {formatDate(complaint.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="my-complaint-card-footer">
                    <span
                      className={`my-complaint-priority priority-${(
                        complaint.priority || 'Medium'
                      ).toLowerCase()}`}
                    >
                      {complaint.priority || 'Medium'} Priority
                    </span>

                    <button
                      type="button"
                      className="my-complaint-view-button"
                      onClick={() =>
                        openComplaintDetails(complaint)
                      }
                    >
                      View Details
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* EMPTY STATE */

            <div className="my-complaints-empty">
              <span className="my-complaints-empty-icon">
                <Inbox size={30} />
              </span>

              <h3>
                {searchTerm || activeFilter !== 'All'
                  ? 'No matching complaints'
                  : 'No complaints yet'}
              </h3>

              <p>
                {searchTerm || activeFilter !== 'All'
                  ? 'Try changing your search or selecting another filter.'
                  : 'When you report a campus issue, it will appear here so you can track its progress.'}
              </p>

              {!searchTerm && activeFilter === 'All' && (
                <button
                  type="button"
                  className="my-complaints-create-button"
                  onClick={() =>
                    navigate('/student/complaints/new')
                  }
                >
                  <Plus size={17} />
                  Report Your First Issue
                </button>
              )}
            </div>
          )}
        </section>

        {/* HELP NOTE */}

        <div className="my-complaints-help">
          <Clock3 size={18} />

          <p>
            <strong>Waiting for an update?</strong> Your complaint
            status will change as the campus team works on your issue.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}