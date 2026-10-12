import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Tag,
  AlertTriangle,
  FileText,
  Clock3,
  CheckCircle2,
  CircleDot,
  UserRound,
  Wrench,
  Camera,
  MessageSquare,
  ShieldCheck,
  ClipboardCheck,
  Info,
  RotateCcw,
} from 'lucide-react'

import MainLayout from '../../components/layout/MainLayout'
import {
  getComplaintById,
  confirmComplaint,
  reportComplaintNotFixed,
} from '../../services/complaintService.js'

import './ComplaintDetailsPage.css'

function normalizeStatus(status) {
  const value = String(status || 'Pending').trim().toLowerCase()

  if (value === 'closed' || value === 'confirmed') {
    return 'Closed'
  }

  if (
    value.includes('awaiting confirmation') ||
    value.includes('pending confirmation') ||
    value.includes('resolved') ||
    value.includes('completed')
  ) {
    return 'Awaiting Confirmation'
  }

  if (value.includes('progress') || value.includes('working')) {
    return 'In Progress'
  }

  if (value.includes('assign') || value.includes('accepted')) {
    return 'Assigned'
  }

  return 'Pending'
}

function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getMongoId(complaint) {
  return complaint?._id || ''
}

function getStaffName(staff) {
  if (!staff) return 'Not assigned yet'

  if (typeof staff === 'string') return staff

  return staff.name || 'Not assigned yet'
}

function getImageUrl(image) {
  if (typeof image === 'string') return image

  return image?.url || image?.dataUrl || image?.preview || ''
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status)

  let Icon = Clock3

  if (normalized === 'Assigned') Icon = UserRound
  if (normalized === 'In Progress') Icon = Wrench
  if (normalized === 'Awaiting Confirmation') Icon = ClipboardCheck
  if (normalized === 'Closed') Icon = CheckCircle2

  return (
    <span
      className={`details-status details-status-${normalized
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      <Icon size={16} />
      {normalized}
    </span>
  )
}

function buildTimeline(complaint) {
  const status = normalizeStatus(complaint.status)
  const assigned = Boolean(complaint.assignedStaff)

  const workStarted = [
    'In Progress',
    'Awaiting Confirmation',
    'Closed',
  ].includes(status)

  const repairCompleted = [
    'Awaiting Confirmation',
    'Closed',
  ].includes(status)

  const studentConfirmed = status === 'Closed'

  return [
    {
      title: 'Complaint Submitted',
      description: 'Your complaint has been submitted successfully.',
      date: complaint.createdAt,
      completed: true,
      Icon: CheckCircle2,
    },
    {
      title: 'Assigned to Campus Team',
      description: assigned
        ? `Assigned to ${getStaffName(complaint.assignedStaff)}.`
        : 'Your complaint is waiting to be assigned.',
      date: complaint.assignedAt,
      completed: assigned,
      Icon: UserRound,
    },
    {
      title: 'Work in Progress',
      description: workStarted
        ? 'The assigned staff member has started working on the issue.'
        : 'Repair work has not started yet.',
      date: complaint.startedAt || complaint.workStartedAt,
      completed: workStarted,
      Icon: Wrench,
    },
    {
      title: 'Repair Completed',
      description: repairCompleted
        ? 'The staff member submitted the repair for confirmation.'
        : 'This step will be completed after the repair work.',
      date: complaint.resolvedAt,
      completed: repairCompleted,
      Icon: ClipboardCheck,
    },
    {
      title: 'Student Confirmation',
      description: studentConfirmed
        ? 'You confirmed that the issue has been fixed.'
        : repairCompleted
          ? 'Please check the repair and confirm whether the issue is fixed.'
          : 'Confirmation will be available after repair completion.',
      date: complaint.closedAt,
      completed: studentConfirmed,
      Icon: ShieldCheck,
    },
  ]
}

export default function ComplaintDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [notice, setNotice] = useState({
    type: '',
    message: '',
  })

  const loadComplaint = useCallback(async () => {
    if (!id) {
      setComplaint(null)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // The route must contain MongoDB _id because the backend
      // searches by _id and verifies ownership by the logged-in student.
      const response = await getComplaintById(id)
      setComplaint(response?.complaint || null)
    } catch (error) {
      console.error('Unable to load complaint:', error.message)
      setComplaint(null)
      setNotice({
        type: 'error',
        message: error.message || 'Unable to load complaint details.',
      })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadComplaint()
  }, [loadComplaint])

  async function handleStudentAction(nextStatus) {
    if (!complaint || actionLoading) return

    const isConfirming = nextStatus === 'Closed'

    const confirmationMessage = isConfirming
      ? 'Have you checked the repair and confirmed that the issue is fixed?'
      : 'Are you sure the issue is still not fixed? The complaint will return to In Progress.'

    if (!window.confirm(confirmationMessage)) return

    const mongoId = getMongoId(complaint)

    if (!mongoId) {
      setNotice({
        type: 'error',
        message: 'MongoDB complaint ID is missing. Please reload the complaint.',
      })
      return
    }

    setActionLoading(true)
    setNotice({ type: '', message: '' })

    try {
      const response = isConfirming
        ? await confirmComplaint(mongoId)
        : await reportComplaintNotFixed(mongoId)

      if (response?.complaint) {
        setComplaint(response.complaint)
      } else {
        await loadComplaint()
      }

      setNotice({
        type: 'success',
        message: isConfirming
          ? 'Repair confirmed successfully! Your complaint is now closed.'
          : 'Complaint returned to In Progress.',
      })
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message || 'Unable to update complaint.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="complaint-details-page">
          <div className="details-card">Loading complaint details...</div>
        </div>
      </MainLayout>
    )
  }

  if (!complaint) {
    return (
      <MainLayout>
        <div className="complaint-details-page">
          <button
            type="button"
            className="details-back-button"
            onClick={() => navigate('/student/complaints')}
          >
            <ArrowLeft size={18} />
            Back to My Complaints
          </button>

          <div className="details-card">
            <Info size={32} />
            <h2>Unable to Load Complaint</h2>
            <p>
              Complaint details load avvaledu. Complaint ID, login status,
              and backend response check cheyyali.
            </p>

            {notice.message && (
              <p className="details-notice-error">{notice.message}</p>
            )}

            <button type="button" onClick={loadComplaint}>
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const status = normalizeStatus(complaint.status)
  const canConfirmRepair = status === 'Awaiting Confirmation'
  const isClosed = status === 'Closed'

  const complaintImages = Array.isArray(complaint.images)
    ? complaint.images
    : []

  const repairImages = Array.isArray(complaint.repairPhotos)
    ? complaint.repairPhotos
    : []

  const timeline = buildTimeline(complaint)

  return (
    <MainLayout>
      <div className="complaint-details-page">
        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate('/student/complaints')}
        >
          <ArrowLeft size={18} />
          Back to My Complaints
        </button>

        <div className="details-header">
          <div>
            <span className="details-eyebrow">COMPLAINT DETAILS</span>
            <h1>{complaint.title || 'Untitled Complaint'}</h1>
            <p>
              Complaint ID:{' '}
              <strong>
                {complaint.complaintId || getMongoId(complaint)}
              </strong>
            </p>
          </div>

          <StatusBadge status={status} />
        </div>

        {notice.message && (
          <div
            className={`details-notice details-notice-${notice.type}`}
            role="status"
          >
            {notice.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span>{notice.message}</span>
          </div>
        )}

        {canConfirmRepair && (
          <section className="details-card details-confirmation-card">
            <div className="details-section-heading">
              <div className="details-section-icon">
                <ClipboardCheck size={23} />
              </div>

              <div>
                <h2>Is your issue fixed?</h2>
                <p>
                  Staff completed the repair. Please check the repair
                  before confirming.
                </p>
              </div>
            </div>

            {repairImages.length > 0 && (
              <div className="details-repair-evidence">
                <h3>
                  <Camera size={17} />
                  Repair Evidence
                </h3>

                <p>
                  Staff uploaded {repairImages.length} repair photo(s).
                </p>

                <div className="details-photo-list">
                  {repairImages.map((image, index) => {
                    const url = getImageUrl(image)

                    return (
                      <div
                        className="details-photo-item"
                        key={image.publicId || url || index}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={`Repair evidence ${index + 1}`}
                          />
                        ) : (
                          <div className="details-photo-placeholder">
                            <Camera size={24} />
                          </div>
                        )}

                        <span>{`Repair photo ${index + 1}`}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {complaint.resolutionNote && (
              <div className="details-resolution-note">
                <h3>Staff Resolution Note</h3>
                <p>{complaint.resolutionNote}</p>
              </div>
            )}

            <div className="details-confirmation-actions">
              <button
                type="button"
                className="details-confirm-button"
                disabled={actionLoading}
                onClick={() => handleStudentAction('Closed')}
              >
                <CheckCircle2 size={18} />
                {actionLoading ? 'Updating...' : 'Confirm Repair'}
              </button>

              <button
                type="button"
                className="details-not-fixed-button"
                disabled={actionLoading}
                onClick={() => handleStudentAction('In Progress')}
              >
                <RotateCcw size={18} />
                Issue Not Fixed
              </button>
            </div>

            <p className="details-confirmation-help">
              <Info size={15} />
              Confirm only after checking the repair. If the issue remains,
              choose “Issue Not Fixed”.
            </p>
          </section>
        )}

        {isClosed && (
          <section className="details-card details-closed-card">
            <div className="details-closed-icon">
              <CheckCircle2 size={30} />
            </div>

            <div>
              <h2>Repair Confirmed!</h2>
              <p>
                You confirmed that the issue has been fixed. This complaint
                is now closed.
              </p>
              <p>
                <strong>Confirmed on:</strong>{' '}
                {formatDateTime(complaint.closedAt)}
              </p>
            </div>
          </section>
        )}

        <section className="details-card">
          <div className="details-section-heading">
            <div className="details-section-icon">
              <FileText size={22} />
            </div>

            <div>
              <h2>Complaint Overview</h2>
              <p>Information provided when the complaint was submitted.</p>
            </div>
          </div>

          <div className="details-info-grid">
            <div className="details-info-item">
              <span className="details-info-label">
                <Tag size={16} />
                Category
              </span>
              <strong>{complaint.category || 'Not specified'}</strong>
            </div>

            <div className="details-info-item">
              <span className="details-info-label">
                <MapPin size={16} />
                Location
              </span>
              <strong>{complaint.location || 'Not specified'}</strong>
            </div>

            <div className="details-info-item">
              <span className="details-info-label">
                <AlertTriangle size={16} />
                Priority
              </span>
              <strong>{complaint.priority || 'Medium'}</strong>
            </div>

            <div className="details-info-item">
              <span className="details-info-label">
                <CalendarDays size={16} />
                Submitted On
              </span>
              <strong>{formatDate(complaint.createdAt)}</strong>
            </div>

            <div className="details-info-item">
              <span className="details-info-label">
                <UserRound size={16} />
                Assigned Staff
              </span>
              <strong>{getStaffName(complaint.assignedStaff)}</strong>
            </div>

            <div className="details-info-item">
              <span className="details-info-label">
                <Clock3 size={16} />
                Last Updated
              </span>
              <strong>
                {formatDateTime(complaint.updatedAt || complaint.createdAt)}
              </strong>
            </div>
          </div>
        </section>

        <section className="details-card">
          <div className="details-section-heading">
            <div className="details-section-icon">
              <MessageSquare size={22} />
            </div>

            <div>
              <h2>Problem Description</h2>
              <p>Detailed information about the reported issue.</p>
            </div>
          </div>

          <p className="details-description">
            {complaint.description || 'No description was provided.'}
          </p>
        </section>

        <section className="details-card">
          <div className="details-section-heading">
            <div className="details-section-icon">
              <Camera size={22} />
            </div>

            <div>
              <h2>Complaint Photos</h2>
              <p>Images uploaded when the complaint was submitted.</p>
            </div>
          </div>

          {complaintImages.length > 0 ? (
            <div className="details-photo-list">
              {complaintImages.map((image, index) => {
                const url = getImageUrl(image)

                return (
                  <div
                    className="details-photo-item"
                    key={image.publicId || url || index}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={`Complaint image ${index + 1}`}
                      />
                    ) : (
                      <div className="details-photo-placeholder">
                        <Camera size={24} />
                      </div>
                    )}

                    <span>{`Complaint photo ${index + 1}`}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="details-empty-text">
              No complaint photos were uploaded.
            </p>
          )}
        </section>

        <section className="details-card">
          <div className="details-section-heading">
            <div className="details-section-icon">
              <CircleDot size={22} />
            </div>

            <div>
              <h2>Complaint Timeline</h2>
              <p>Track the progress of your complaint.</p>
            </div>
          </div>

          <div className="details-timeline">
            {timeline.map((item) => {
              const Icon = item.Icon

              return (
                <div
                  className={`details-timeline-item ${
                    item.completed
                      ? 'details-timeline-item-completed'
                      : ''
                  }`}
                  key={item.title}
                >
                  <div className="details-timeline-marker">
                    <Icon size={19} />
                  </div>

                  <div className="details-timeline-content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>

                    {item.date && (
                      <span>{formatDateTime(item.date)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="details-info-note">
          <Info size={20} />
          <p>
            Staff repair submit chesaka, complaint close avvadaniki student
            confirmation avasaram.
          </p>
        </section>
      </div>
    </MainLayout>
  )
}