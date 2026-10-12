// CampusFix — Backend-integrated complaint management.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Search,
  ClipboardList,
  MapPin,
  CalendarDays,
  Clock3,
  CheckCircle2,
  CircleDot,
  Eye,
  UserRound,
  Wrench,
  AlertTriangle,
  Filter,
  RefreshCw,
  X,
  Save,
  ArrowLeft,
  Users,
  FileText,
  Camera,
  ImageOff,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react'

import {
  getAllComplaints,
  getActiveStaff,
  assignComplaint,
} from '../../services/adminService.js'

import './ManageComplaintsPage.css'

const STATUS_OPTIONS = [
  'Pending',
  'Assigned',
  'In Progress',
  'Awaiting Confirmation',
  'Closed',
]

const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low']

/* ---------------------------------------
   Backend data mapping
--------------------------------------- */

function mapBackendComplaint(item) {
  return {
    ...item,

    id: item._id,
    complaintId: item.complaintId,

    title: item.title || 'Untitled issue',
    category: item.category || 'Other',
    location: item.location || '',
    description: item.description || '',
    priority: item.priority || 'Medium',
    status: item.status || 'Pending',

    student:
      typeof item.student === 'object' && item.student !== null
        ? item.student.name || item.student.email || 'Student'
        : item.student || 'Student',

    studentId:
      typeof item.student === 'object' && item.student !== null
        ? item.student._id
        : item.student,

    assignedStaff:
      typeof item.assignedStaff === 'object' && item.assignedStaff !== null
        ? item.assignedStaff._id
        : item.assignedStaff || '',

    assignedStaffName:
      typeof item.assignedStaff === 'object' && item.assignedStaff !== null
        ? item.assignedStaff.name || ''
        : '',

    images: Array.isArray(item.images) ? item.images : [],
    repairPhotos: Array.isArray(item.repairPhotos)
      ? item.repairPhotos
      : [],

    resolutionNote: item.resolutionNote || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

/* ---------------------------------------
   Date formatting
--------------------------------------- */

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
   Status normalization
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
  const value = String(priority || '').toLowerCase()

  if (value === 'high') return 'High'
  if (value === 'low') return 'Low'

  return 'Medium'
}

/* ---------------------------------------
   Image helpers
--------------------------------------- */

function getImageSource(image) {
  if (typeof image === 'string') {
    if (
      image.startsWith('data:image/') ||
      image.startsWith('https://') ||
      image.startsWith('http://')
    ) {
      return image
    }

    return ''
  }

  if (!image || typeof image !== 'object') {
    return ''
  }

  const candidates = [
    image.dataUrl,
    image.preview,
    image.url,
  ]

  for (const source of candidates) {
    if (
      typeof source === 'string' &&
      (
        source.startsWith('data:image/') ||
        source.startsWith('https://') ||
        source.startsWith('http://')
      )
    ) {
      return source
    }
  }

  return ''
}

function getImageName(image, index) {
  if (typeof image === 'string') {
    return `Complaint photo ${index + 1}`
  }

  return image?.name || `Complaint photo ${index + 1}`
}

/* ---------------------------------------
   Status badges
--------------------------------------- */

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status)

  let Icon = Clock3

  if (normalized === 'Closed') {
    Icon = CheckCircle2
  } else if (normalized === 'Awaiting Confirmation') {
    Icon = ClipboardCheck
  } else if (normalized === 'In Progress') {
    Icon = CircleDot
  } else if (normalized === 'Assigned') {
    Icon = UserRound
  }

  return (
    <span
      className={`manage-status manage-status-${normalized
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      <Icon size={14} />
      {normalized}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const normalized = normalizePriority(priority)

  return (
    <span
      className={`manage-priority manage-priority-${normalized.toLowerCase()}`}
    >
      {normalized === 'High' && <AlertTriangle size={13} />}
      {normalized} Priority
    </span>
  )
}

/* ---------------------------------------
   Complaint photo gallery
--------------------------------------- */

function ComplaintPhotoGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(null)

  if (!Array.isArray(images) || images.length === 0) {
    return (
      <div className="manage-no-photos">
        <ImageOff size={22} />
        <span>No photos were attached to this complaint.</span>
      </div>
    )
  }

  return (
    <>
      <div className="manage-photo-grid">
        {images.map((image, index) => {
          const source = getImageSource(image)
          const name = getImageName(image, index)

          return (
            <button
              type="button"
              className="manage-photo-card"
              key={`${name}-${index}`}
              onClick={() => {
                if (source) setSelectedImage({ source, name })
              }}
              disabled={!source}
              title={source ? `View ${name}` : 'Image preview unavailable'}
            >
              {source ? (
                <img
                  src={source}
                  alt={name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                    event.currentTarget.parentElement.classList.add(
                      'manage-photo-unavailable'
                    )
                  }}
                />
              ) : (
                <span className="manage-photo-placeholder">
                  <ImageOff size={25} />
                  Preview unavailable
                </span>
              )}

              <span className="manage-photo-name">{name}</span>
            </button>
          )
        })}
      </div>

      {selectedImage && (
        <div
          className="manage-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Full-size complaint image"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedImage(null)
            }
          }}
        >
          <div className="manage-image-lightbox-content">
            <div className="manage-image-lightbox-header">
              <strong>{selectedImage.name}</strong>

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                aria-label="Close image"
              >
                <X size={21} />
              </button>
            </div>

            <img src={selectedImage.source} alt={selectedImage.name} />
          </div>
        </div>
      )}
    </>
  )
}

/* =======================================
   MAIN COMPONENT
======================================= */

export default function ManageComplaintsPage() {
  const navigate = useNavigate()

  const [complaints, setComplaints] = useState([])
  const [staffMembers, setStaffMembers] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [editingComplaint, setEditingComplaint] = useState(null)
  const [notice, setNotice] = useState('')

  /* ---------------------------------------
     Load complaints and active staff
  --------------------------------------- */

  async function loadAdminData(showLoading = true) {
    if (showLoading) setLoading(true)

    setLoadError('')

    try {
      const [complaintResponse, staffResponse] = await Promise.all([
        getAllComplaints(),
        getActiveStaff(),
      ])

      const latestComplaints = (
        complaintResponse.complaints || []
      ).map(mapBackendComplaint)

      setComplaints(latestComplaints)
      setStaffMembers(staffResponse.staff || [])

      setSelectedComplaint((previous) => {
        if (!previous) return null

        return (
          latestComplaints.find(
            (item) => String(item.id) === String(previous.id)
          ) || null
        )
      })
    } catch (error) {
      console.error('Admin data loading error:', error)
      setLoadError(error.message || 'Unable to load admin data.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  /* ---------------------------------------
     Counts
  --------------------------------------- */

  const counts = useMemo(
    () => ({
      all: complaints.length,

      pending: complaints.filter(
        (item) => normalizeStatus(item.status) === 'Pending'
      ).length,

      assigned: complaints.filter(
        (item) => normalizeStatus(item.status) === 'Assigned'
      ).length,

      progress: complaints.filter(
        (item) => normalizeStatus(item.status) === 'In Progress'
      ).length,

      awaiting: complaints.filter(
        (item) =>
          normalizeStatus(item.status) === 'Awaiting Confirmation'
      ).length,

      closed: complaints.filter(
        (item) => normalizeStatus(item.status) === 'Closed'
      ).length,
    }),
    [complaints]
  )

  /* ---------------------------------------
     Search and filters
  --------------------------------------- */

  const filteredComplaints = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return complaints.filter((complaint) => {
      const matchesSearch =
        !query ||
        [
          complaint.complaintId,
          complaint.id,
          complaint.title,
          complaint.category,
          complaint.location,
          complaint.description,
          complaint.assignedStaffName,
          complaint.student,
        ].some((value) =>
          String(value || '').toLowerCase().includes(query)
        )

      const matchesStatus =
        statusFilter === 'All' ||
        normalizeStatus(complaint.status) === statusFilter

      const matchesPriority =
        priorityFilter === 'All' ||
        normalizePriority(complaint.priority) === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [complaints, searchTerm, statusFilter, priorityFilter])

  async function refreshComplaints() {
    await loadAdminData()
    setNotice('Complaint list refreshed.')
  }

  /* ---------------------------------------
     Open assignment modal
  --------------------------------------- */

  function openEdit(complaint) {
    setEditingComplaint({
      ...complaint,
      status: normalizeStatus(complaint.status),
      priority: normalizePriority(complaint.priority),
      assignedStaff: complaint.assignedStaff || '',
    })

    setSelectedComplaint(null)
    setNotice('')
  }

  /* ---------------------------------------
     Assign complaint through backend
  --------------------------------------- */

  async function saveChanges(event) {
    event.preventDefault()

    if (!editingComplaint) return

    const staffId = editingComplaint.assignedStaff

    if (!staffId) {
      setNotice('Please select a staff member before assigning.')
      return
    }

    if (normalizeStatus(editingComplaint.status) === 'Closed') {
      setNotice(
        'Only the student can confirm the repair and close this complaint.'
      )
      return
    }

    setSaving(true)
    setNotice('')

    try {
      await assignComplaint(editingComplaint.id, staffId)

      await loadAdminData(false)

      setEditingComplaint(null)
      setSelectedComplaint(null)
      setNotice('Complaint assigned successfully.')
    } catch (error) {
      console.error('Complaint assignment error:', error)
      setNotice(error.message || 'Unable to assign complaint.')
    } finally {
      setSaving(false)
    }
  }

  /* ---------------------------------------
     Loading and error states
  --------------------------------------- */

  if (loading) {
    return (
      <div className="manage-page">
        <header className="manage-topbar">
          <div className="manage-brand">
            <span className="manage-brand-icon">
              <ClipboardList size={23} />
            </span>

            <div>
              <strong>CampusFix</strong>
              <span>Administration</span>
            </div>
          </div>
        </header>

        <main className="manage-content">
          <div className="manage-notice">
            <RefreshCw size={16} />
            Loading complaints from the server...
          </div>
        </main>
      </div>
    )
  }

  if (loadError && complaints.length === 0) {
    return (
      <div className="manage-page">
        <header className="manage-topbar">
          <div className="manage-brand">
            <span className="manage-brand-icon">
              <ClipboardList size={23} />
            </span>

            <div>
              <strong>CampusFix</strong>
              <span>Administration</span>
            </div>
          </div>

          <button
            type="button"
            className="manage-back-dashboard"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
        </header>

        <main className="manage-content">
          <div className="manage-notice" role="alert">
            <AlertTriangle size={18} />
            <span>{loadError}</span>
          </div>

          <button
            type="button"
            className="manage-refresh-button"
            onClick={() => loadAdminData()}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </main>
      </div>
    )
  }

  /* ---------------------------------------
     Main page
  --------------------------------------- */

  return (
    <div className="manage-page">
      <header className="manage-topbar">
        <div className="manage-brand">
          <span className="manage-brand-icon">
            <ClipboardList size={23} />
          </span>

          <div>
            <strong>CampusFix</strong>
            <span>Administration</span>
          </div>
        </div>

        <button
          type="button"
          className="manage-back-dashboard"
          onClick={() => navigate('/admin/dashboard')}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>
      </header>

      <main className="manage-content">
        <div className="manage-page-heading">
          <div>
            <span className="manage-eyebrow">
              <Users size={14} />
              CAMPUS OPERATIONS
            </span>

            <h1>Complaint Management</h1>

            <p>
              Review reports, assign staff, and track campus issue
              resolution.
            </p>
          </div>

          <button
            type="button"
            className="manage-refresh-button"
            onClick={refreshComplaints}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {notice && (
          <div className="manage-notice" role="status">
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice('')}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loadError && (
          <div className="manage-notice" role="alert">
            <span>{loadError}</span>

            <button
              type="button"
              onClick={() => loadAdminData()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Statistics */}

        <section className="manage-stats">
          <article className="manage-stat">
            <span className="manage-stat-icon total">
              <ClipboardList size={20} />
            </span>

            <div>
              <span>Total Complaints</span>
              <strong>{counts.all}</strong>
            </div>
          </article>

          <article className="manage-stat">
            <span className="manage-stat-icon pending">
              <Clock3 size={20} />
            </span>

            <div>
              <span>Pending</span>
              <strong>{counts.pending}</strong>
            </div>
          </article>

          <article className="manage-stat">
            <span className="manage-stat-icon progress">
              <Wrench size={20} />
            </span>

            <div>
              <span>In Progress</span>
              <strong>{counts.progress}</strong>
            </div>
          </article>

          <article className="manage-stat">
            <span className="manage-stat-icon resolved">
              <CheckCircle2 size={20} />
            </span>

            <div>
              <span>Awaiting Confirmation</span>
              <strong>{counts.awaiting}</strong>
            </div>
          </article>

          <article className="manage-stat">
            <span className="manage-stat-icon resolved">
              <ShieldCheck size={20} />
            </span>

            <div>
              <span>Closed</span>
              <strong>{counts.closed}</strong>
            </div>
          </article>
        </section>

        {/* Complaints table */}

        <section className="manage-panel">
          <div className="manage-panel-heading">
            <div>
              <h2>All Complaints</h2>

              <p>
                {filteredComplaints.length} matching{' '}
                {filteredComplaints.length === 1 ? 'record' : 'records'}
              </p>
            </div>

            <span className="manage-demo-pill">
              Live backend data
            </span>
          </div>

          <div className="manage-toolbar">
            <label className="manage-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search ID, title, location or staff..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </label>

            <label className="manage-filter-select">
              <Filter size={16} />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>

                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="manage-filter-select">
              <AlertTriangle size={16} />

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority === 'All'
                      ? 'All priorities'
                      : `${priority} priority`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="manage-table-wrap">
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>
                      <div className="manage-complaint-cell">
                        <span className="manage-complaint-icon">
                          <FileText size={19} />
                        </span>

                        <div>
                          <strong>
                            {complaint.title || 'Untitled issue'}
                          </strong>

                          <span>
                            {complaint.complaintId || complaint.id} ·{' '}
                            {complaint.category || 'Other'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="manage-location">
                        <MapPin size={14} />
                        {complaint.location || 'Not specified'}
                      </span>
                    </td>

                    <td>
                      <PriorityBadge priority={complaint.priority} />
                    </td>

                    <td>
                      <StatusBadge status={complaint.status} />
                    </td>

                    <td>
                      <span className="manage-assigned-staff">
                        <UserRound size={14} />
                        {complaint.assignedStaffName || 'Not assigned'}
                      </span>
                    </td>

                    <td>
                      <span className="manage-date">
                        <CalendarDays size={14} />
                        {formatDate(complaint.createdAt)}
                      </span>
                    </td>

                    <td>
                      <div className="manage-actions">
                        <button
                          type="button"
                          className="manage-action-button view"
                          onClick={() => setSelectedComplaint(complaint)}
                          title="View complaint"
                        >
                          <Eye size={15} />
                          View
                        </button>

                        <button
                          type="button"
                          className="manage-action-button edit"
                          onClick={() => openEdit(complaint)}
                          title="Assign staff"
                          disabled={complaint.status === 'Closed'}
                        >
                          <Wrench size={15} />
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredComplaints.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="manage-empty">
                        <ClipboardList size={28} />

                        <strong>No complaints found</strong>

                        <span>
                          {searchTerm ||
                          statusFilter !== 'All' ||
                          priorityFilter !== 'All'
                            ? 'Try changing your search or filters.'
                            : 'No complaints have been submitted yet.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="manage-table-footer">
            <span>
              Showing {filteredComplaints.length} of {counts.all} complaints
            </span>

            <span>CampusFix · Administration</span>
          </footer>
        </section>
      </main>

      {/* View complaint details */}

      {selectedComplaint && (
        <div
          className="manage-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedComplaint(null)
            }
          }}
        >
          <section
            className="manage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-view-title"
          >
            <div className="manage-modal-heading">
              <div>
                <span className="manage-eyebrow">
                  {selectedComplaint.complaintId || selectedComplaint.id}
                </span>

                <h2 id="manage-view-title">
                  {selectedComplaint.title || 'Complaint details'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="manage-modal-badges">
              <StatusBadge status={selectedComplaint.status} />
              <PriorityBadge priority={selectedComplaint.priority} />
            </div>

            <div className="manage-modal-detail">
              <span>Category</span>
              <strong>{selectedComplaint.category || 'Other'}</strong>
            </div>

            <div className="manage-modal-detail">
              <span>Location</span>
              <strong>{selectedComplaint.location || 'Not specified'}</strong>
            </div>

            <div className="manage-modal-detail">
              <span>Reported by</span>
              <strong>{selectedComplaint.student || 'Student'}</strong>
            </div>

            <div className="manage-modal-detail">
              <span>Description</span>
              <p>
                {selectedComplaint.description ||
                  'No description was provided.'}
              </p>
            </div>

            {selectedComplaint.resolutionNote && (
              <div className="manage-modal-detail">
                <span>Resolution note</span>
                <p>{selectedComplaint.resolutionNote}</p>
              </div>
            )}

            <div className="manage-modal-photos">
              <strong>
                <Camera size={16} />
                Attached photos
              </strong>

              <ComplaintPhotoGallery images={selectedComplaint.images} />
            </div>

            {selectedComplaint.repairPhotos.length > 0 && (
              <div className="manage-modal-photos">
                <strong>
                  <CheckCircle2 size={16} />
                  Repair evidence
                </strong>

                <ComplaintPhotoGallery
                  images={selectedComplaint.repairPhotos}
                />
              </div>
            )}

            <button
              type="button"
              className="manage-modal-primary"
              onClick={() => openEdit(selectedComplaint)}
              disabled={selectedComplaint.status === 'Closed'}
            >
              <Wrench size={16} />
              Assign Staff
            </button>
          </section>
        </div>
      )}

      {/* Assign staff modal */}

      {editingComplaint && (
        <div
          className="manage-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setEditingComplaint(null)
            }
          }}
        >
          <form
            className="manage-modal manage-edit-modal"
            onSubmit={saveChanges}
          >
            <div className="manage-modal-heading">
              <div>
                <span className="manage-eyebrow">
                  MANAGE COMPLAINT
                </span>

                <h2>{editingComplaint.title}</h2>

                <p>
                  {editingComplaint.complaintId || editingComplaint.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingComplaint(null)}
                aria-label="Close manage dialog"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {notice && (
              <div className="manage-notice" role="status">
                {notice}
              </div>
            )}

            <label className="manage-form-field">
              <span>Assign Staff Member</span>

              <select
                value={editingComplaint.assignedStaff}
                onChange={(event) =>
                  setEditingComplaint((previous) => ({
                    ...previous,
                    assignedStaff: event.target.value,
                  }))
                }
                required
              >
                <option value="">Select staff member</option>

                {staffMembers.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name}
                    {staff.department ? ` — ${staff.department}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="manage-edit-note">
              <Wrench size={17} />

              <p>
                Assigning this complaint updates the database and changes
                its status to Assigned. Staff can then manage the repair.
              </p>
            </div>

            <div className="manage-modal-actions">
              <button
                type="button"
                className="manage-cancel-button"
                onClick={() => setEditingComplaint(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="manage-save-button"
                disabled={saving || staffMembers.length === 0}
              >
                <Save size={16} />
                {saving ? 'Assigning...' : 'Assign Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}