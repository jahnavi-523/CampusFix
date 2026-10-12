// CampusFix — Staff complaint details and repair evidence.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Tag,
  AlertTriangle,
  FileText,
  Clock3,
  UserRound,
  Wrench,
  CheckCircle2,
  Camera,
  Upload,
  X,
  Info,
  ImageOff,
  ClipboardCheck,
} from 'lucide-react'

import {
  getStaffComplaintById,
  updateStaffComplaintStatus,
  uploadStaffRepairPhotos,
} from '../../services/staffService.js'

import './StaffComplaintDetailsPage.css'

const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

/* ---------------------------------------
   Formatting helpers
--------------------------------------- */

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeStatus(status) {
  const value = String(status || 'Pending')
    .trim()
    .toLowerCase()

  if (value === 'closed' || value === 'confirmed') {
    return 'Closed'
  }

  if (value.includes('awaiting confirmation')) {
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

  if (value === 'low') return 'Low'
  if (value === 'high') return 'High'
  if (value === 'urgent') return 'Urgent'

  return 'Medium'
}

function getImageSource(image) {
  if (typeof image === 'string') {
    return image.startsWith('http://') ||
      image.startsWith('https://')
      ? image
      : ''
  }

  if (!image || typeof image !== 'object') {
    return ''
  }

  const source = image.url || image.dataUrl || image.preview

  if (
    typeof source === 'string' &&
    (
      source.startsWith('http://') ||
      source.startsWith('https://') ||
      source.startsWith('data:image/')
    )
  ) {
    return source
  }

  return ''
}

function getImageName(image, index) {
  if (typeof image === 'string') {
    return `Photo ${index + 1}`
  }

  return (
    image?.name ||
    image?.originalName ||
    `Photo ${index + 1}`
  )
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
    Icon = ClipboardCheck
  } else if (normalized === 'In Progress') {
    Icon = Wrench
  } else if (normalized === 'Assigned') {
    Icon = UserRound
  }

  return (
    <span
      className={`staff-detail-status staff-status-${normalized
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      <Icon size={15} />
      {normalized}
    </span>
  )
}

/* ---------------------------------------
   Main component
--------------------------------------- */

export default function StaffComplaintDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [complaint, setComplaint] = useState(null)
  const [staffName, setStaffName] = useState('Maintenance Staff')
  const [repairPhotos, setRepairPhotos] = useState([])
  const [resolutionNote, setResolutionNote] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  /* Get the logged-in user's display name. */

  useEffect(() => {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of ['user', 'currentUser']) {
        try {
          const stored = JSON.parse(
            storage.getItem(key) || 'null'
          )

          const user = stored?.user || stored

          const name =
            user?.name ||
            user?.fullName ||
            user?.username

          if (typeof name === 'string' && name.trim()) {
            setStaffName(name.trim())
            return
          }
        } catch {
          // Ignore invalid stored profile data.
        }
      }
    }
  }, [])

  /* Fetch the complaint from the backend. */

  const loadComplaint = useCallback(async () => {
    setIsLoading(true)
    setNotice('')

    try {
      const response = await getStaffComplaintById(id)

      if (!response?.complaint) {
        throw new Error(
          response?.message || 'Complaint details were not returned.'
        )
      }

      setComplaint(response.complaint)

      setResolutionNote(
        response.complaint.resolutionNote || ''
      )
    } catch (error) {
      console.error('Load complaint error:', error)
      setComplaint(null)
      setNotice(
        error.message || 'Unable to load complaint details.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadComplaint()
  }, [loadComplaint])

  /* Clean up local image previews. */

  useEffect(() => {
    return () => {
      repairPhotos.forEach((photo) => {
        URL.revokeObjectURL(photo.preview)
      })
    }
  }, [repairPhotos])

  /* Select repair photos. */

  function handlePhotoSelection(event) {
    const files = Array.from(event.target.files || [])
    const alreadyUploaded =
      complaint?.repairPhotos?.length || 0

    const remainingSlots =
      MAX_PHOTOS - alreadyUploaded - repairPhotos.length

    const newPhotos = []
    const errors = []

    if (remainingSlots <= 0) {
      setPhotoError(
        `Maximum ${MAX_PHOTOS} repair photos allowed.`
      )
      event.target.value = ''
      return
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Use JPG, PNG or WEBP.`)
        continue
      }

      if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Image must be at most 5 MB.`)
        continue
      }

      const duplicate = [...repairPhotos, ...newPhotos].some(
        (photo) =>
          photo.name === file.name &&
          photo.size === file.size
      )

      if (duplicate) {
        errors.push(`${file.name}: Already selected.`)
        continue
      }

      if (newPhotos.length >= remainingSlots) {
        errors.push(
          `Maximum ${MAX_PHOTOS} repair photos allowed.`
        )
        break
      }

      newPhotos.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
      })
    }

    setRepairPhotos((previous) => [
      ...previous,
      ...newPhotos,
    ])

    setPhotoError(errors.join(' '))
    event.target.value = ''
  }

  function removePhoto(photoId) {
    setRepairPhotos((previous) => {
      const photo = previous.find(
        (item) => item.id === photoId
      )

      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview)
      }

      return previous.filter((item) => item.id !== photoId)
    })

    setPhotoError('')
  }

  /* Update repair status through the backend. */

  async function startRepair() {
    if (!complaint || isSaving) return

    setNotice('')
    setIsSaving(true)

    try {
      const response = await updateStaffComplaintStatus(
        id,
        'In Progress'
      )

      if (!response?.complaint) {
        throw new Error(
          response?.message || 'Could not start repair.'
        )
      }

      setComplaint(response.complaint)
      setNotice('Repair started successfully.')
    } catch (error) {
      console.error('Start repair error:', error)
      setNotice(error.message || 'Unable to start repair.')
    } finally {
      setIsSaving(false)
    }
  }

  /* Upload repair photos to Cloudinary through the backend. */

  async function uploadRepairEvidence() {
    if (!complaint || isSaving) return

    if (repairPhotos.length === 0) {
      setPhotoError('Please select at least one repair photo.')
      return
    }

    if (!resolutionNote.trim()) {
      setNotice(
        'Please enter a resolution note before submitting the repair.'
      )
      return
    }

    setNotice('')
    setPhotoError('')
    setIsSaving(true)

    try {
      // Upload selected images first.
      const files = repairPhotos.map((photo) => photo.file)

      const uploadResponse = await uploadStaffRepairPhotos(
        id,
        files
      )

      if (!uploadResponse?.complaint) {
        throw new Error(
          uploadResponse?.message ||
            'Repair photos could not be saved.'
        )
      }

      setComplaint(uploadResponse.complaint)
      setRepairPhotos([])

      // Then update the status to Awaiting Confirmation.
      const statusResponse = await updateStaffComplaintStatus(
        id,
        'Awaiting Confirmation',
        resolutionNote.trim()
      )

      if (!statusResponse?.complaint) {
        throw new Error(
          statusResponse?.message ||
            'Photos uploaded, but status update failed. Retry submitting the repair.'
        )
      }

      setComplaint(statusResponse.complaint)
      setNotice(
        'Repair submitted successfully. Waiting for student confirmation.'
      )
    } catch (error) {
      console.error('Submit repair error:', error)

      setNotice(
        error.message ||
          'Unable to submit repair. Please try again.'
      )

      // Refresh in case the photo upload succeeded but the status
      // update failed. Existing uploaded photos must not be lost.
      try {
        const response = await getStaffComplaintById(id)

        if (response?.complaint) {
          setComplaint(response.complaint)
        }
      } catch {
        // Keep the current page state if refreshing also fails.
      }
    } finally {
      setIsSaving(false)
    }
  }

  /* Loading page. */

  if (isLoading) {
    return (
      <div className="staff-detail-page">
        <header className="staff-detail-header">
          <div className="staff-detail-brand">
            <span className="staff-detail-brand-icon">
              <Wrench size={23} />
            </span>

            <div>
              <strong>CampusFix</strong>
              <span>Staff Workspace</span>
            </div>
          </div>
        </header>

        <main className="staff-detail-content">
          <section className="staff-detail-empty">
            <Clock3 size={30} />
            <h1>Loading Complaint...</h1>
            <p>Fetching complaint details from the backend.</p>
          </section>
        </main>
      </div>
    )
  }

  /* Not found / API error page. */

  if (!complaint) {
    return (
      <div className="staff-detail-page">
        <header className="staff-detail-header">
          <div className="staff-detail-brand">
            <span className="staff-detail-brand-icon">
              <Wrench size={23} />
            </span>

            <div>
              <strong>CampusFix</strong>
              <span>Staff Workspace</span>
            </div>
          </div>
        </header>

        <main className="staff-detail-content">
          <section className="staff-detail-empty">
            <FileText size={34} />

            <h1>Unable to Load Complaint</h1>

            <p>
              {notice ||
                'The complaint may not exist or may not be assigned to your account.'}
            </p>

            <button
              type="button"
              className="staff-detail-primary"
              onClick={() => navigate('/staff/dashboard')}
            >
              <ArrowLeft size={16} />
              Back to Assignments
            </button>

            <button
              type="button"
              className="staff-detail-secondary"
              onClick={loadComplaint}
            >
              Try Again
            </button>
          </section>
        </main>
      </div>
    )
  }

  const status = normalizeStatus(complaint.status)
  const priority = normalizePriority(complaint.priority)

  // The backend guarantees assignment ownership for the detail
  // and update APIs. Do not compare the MongoDB ObjectId to a name.
  const canStartWork = status === 'Assigned'
  const canResolve = status === 'In Progress'

  const originalPhotos = Array.isArray(complaint.images)
    ? complaint.images
    : []

  const savedRepairPhotos = Array.isArray(complaint.repairPhotos)
    ? complaint.repairPhotos
    : []

  const assignedStaffName =
    complaint.assignedStaff &&
    typeof complaint.assignedStaff === 'object'
      ? complaint.assignedStaff.name
      : staffName

  return (
    <div className="staff-detail-page">
      <header className="staff-detail-header">
        <div className="staff-detail-brand">
          <span className="staff-detail-brand-icon">
            <Wrench size={23} />
          </span>

          <div>
            <strong>CampusFix</strong>
            <span>Staff Workspace</span>
          </div>
        </div>

        <div className="staff-detail-user">
          <span className="staff-detail-user-avatar">
            {(staffName.charAt(0) || 'M').toUpperCase()}
          </span>

          <div>
            <strong>{staffName}</strong>
            <span>Maintenance Team</span>
          </div>
        </div>
      </header>

      <main className="staff-detail-content">
        <button
          type="button"
          className="staff-detail-back"
          onClick={() => navigate('/staff/dashboard')}
        >
          <ArrowLeft size={17} />
          Back to My Assignments
        </button>

        <section className="staff-detail-heading">
          <div>
            <span className="staff-detail-eyebrow">
              CAMPUSFIX / ASSIGNMENT DETAILS
            </span>

            <h1>{complaint.title || 'Complaint Details'}</h1>

            <p>
              Review the reported issue and update the repair progress.
            </p>
          </div>

          <StatusBadge status={status} />
        </section>

        {notice && (
          <div className="staff-detail-notice" role="status">
            <Info size={18} />
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

        <div className="staff-detail-layout">
          <div className="staff-detail-main">
            {/* Issue information */}

            <section className="staff-detail-card">
              <div className="staff-detail-card-heading">
                <span className="staff-detail-icon">
                  <FileText size={19} />
                </span>

                <div>
                  <h2>Issue Information</h2>
                  <p>
                    Complaint reference:{' '}
                    {complaint.complaintId || complaint._id}
                  </p>
                </div>
              </div>

              <div className="staff-detail-info-grid">
                <div>
                  <span><Tag size={15} /> Category</span>
                  <strong>{complaint.category || 'Other'}</strong>
                </div>

                <div>
                  <span><MapPin size={15} /> Location</span>
                  <strong>
                    {complaint.location || 'Not specified'}
                  </strong>
                </div>

                <div>
                  <span><CalendarDays size={15} /> Reported On</span>
                  <strong>{formatDate(complaint.createdAt)}</strong>
                </div>

                <div>
                  <span><AlertTriangle size={15} /> Priority</span>
                  <strong
                    className={`staff-detail-priority priority-${priority.toLowerCase()}`}
                  >
                    {priority}
                  </strong>
                </div>
              </div>

              <div className="staff-detail-divider" />

              <h3>Description</h3>

              <p className="staff-detail-description">
                {complaint.description || 'No description provided.'}
              </p>

              {complaint.student && (
                <div className="staff-detail-divider">
                  <span />
                </div>
              )}

              {complaint.student && (
                <div className="staff-detail-side-row">
                  <span>Reported By</span>
                  <strong>
                    {complaint.student.name || 'Student'}
                  </strong>
                </div>
              )}
            </section>

            {/* Reported photos */}

            <section className="staff-detail-card">
              <div className="staff-detail-card-heading">
                <span className="staff-detail-icon">
                  <Camera size={19} />
                </span>

                <div>
                  <h2>Reported Photos</h2>
                  <p>Images submitted with the complaint.</p>
                </div>
              </div>

              {originalPhotos.length > 0 ? (
                <div className="staff-detail-photo-grid">
                  {originalPhotos.map((photo, index) => {
                    const name = getImageName(photo, index)
                    const source = getImageSource(photo)

                    return (
                      <article
                        className="staff-detail-photo"
                        key={`${name}-${index}`}
                      >
                        {source ? (
                          <img
                            src={source}
                            alt={name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="staff-detail-photo-placeholder">
                            <ImageOff size={24} />
                            <small>Preview unavailable</small>
                          </span>
                        )}

                        <span title={name}>{name}</span>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="staff-detail-empty-photos">
                  <Camera size={22} />
                  <p>No photos were attached to this report.</p>
                </div>
              )}
            </section>

            {/* Repair evidence */}

            <section className="staff-detail-card">
              <div className="staff-detail-card-heading">
                <span className="staff-detail-icon">
                  <Upload size={19} />
                </span>

                <div>
                  <h2>Repair Evidence</h2>
                  <p>
                    Add photos showing the completed repair.
                  </p>
                </div>
              </div>

              {savedRepairPhotos.length > 0 && (
                <div className="staff-detail-photo-grid">
                  {savedRepairPhotos.map((photo, index) => {
                    const name = getImageName(photo, index)
                    const source = getImageSource(photo)

                    return (
                      <article
                        className="staff-detail-photo"
                        key={`${name}-${index}`}
                      >
                        {source ? (
                          <img
                            src={source}
                            alt={name}
                            loading="lazy"
                          />
                        ) : (
                          <span className="staff-detail-photo-placeholder">
                            <ImageOff size={24} />
                            <small>Preview unavailable</small>
                          </span>
                        )}

                        <span title={name}>{name}</span>
                      </article>
                    )
                  })}
                </div>
              )}

              {canResolve && savedRepairPhotos.length < MAX_PHOTOS && (
                <>
                  <div className="staff-detail-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotoSelection}
                      disabled={
                        isSaving ||
                        repairPhotos.length +
                          savedRepairPhotos.length >=
                          MAX_PHOTOS
                      }
                    />

                    <Camera size={25} />

                    <strong>Upload repair photos</strong>

                    <span>
                      JPG, PNG or WEBP · Maximum 5 photos · 5 MB each
                    </span>

                    <button
                      type="button"
                      className="staff-detail-secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={
                        isSaving ||
                        repairPhotos.length +
                          savedRepairPhotos.length >=
                          MAX_PHOTOS
                      }
                    >
                      <Upload size={16} />
                      Choose Photos
                    </button>
                  </div>

                  {photoError && (
                    <p
                      className="staff-detail-photo-error"
                      role="alert"
                    >
                      {photoError}
                    </p>
                  )}

                  {repairPhotos.length > 0 && (
                    <div className="staff-detail-photo-grid">
                      {repairPhotos.map((photo) => (
                        <article
                          className="staff-detail-photo"
                          key={photo.id}
                        >
                          <img
                            src={photo.preview}
                            alt={photo.name}
                          />

                          <button
                            type="button"
                            className="staff-detail-remove-photo"
                            onClick={() => removePhoto(photo.id)}
                            aria-label={`Remove ${photo.name}`}
                          >
                            <X size={15} />
                          </button>

                          <span title={photo.name}>
                            {photo.name}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}

                  <label
                    className="staff-detail-resolution-note"
                    style={{
                      display: 'block',
                      marginTop: '18px',
                    }}
                  >
                    <strong>Resolution Note *</strong>

                    <textarea
                      value={resolutionNote}
                      onChange={(event) =>
                        setResolutionNote(event.target.value)
                      }
                      maxLength={1000}
                      rows={4}
                      placeholder="Describe the repair performed and how the issue was resolved..."
                      disabled={isSaving}
                      required
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: '8px',
                        padding: '12px',
                        border: '1px solid #deded5',
                        borderRadius: '10px',
                        font: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />

                    <small>
                      {resolutionNote.length}/1000 characters
                    </small>
                  </label>
                </>
              )}

              {!canResolve && status === 'Assigned' && (
                <div className="staff-detail-empty-photos">
                  <Info size={22} />
                  <p>Start the repair before uploading repair evidence.</p>
                </div>
              )}

              {status === 'Awaiting Confirmation' && (
                <div className="staff-detail-complete">
                  <ClipboardCheck size={19} />
                  <span>
                    Repair submitted. Waiting for the student to confirm
                    that the issue is fixed.
                  </span>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}

          <aside className="staff-detail-sidebar">
            <section className="staff-detail-card">
              <div className="staff-detail-card-heading">
                <span className="staff-detail-icon">
                  <UserRound size={19} />
                </span>

                <div>
                  <h2>Assignment</h2>
                  <p>Current task ownership.</p>
                </div>
              </div>

              <div className="staff-detail-assignee">
                <span className="staff-detail-assignee-avatar">
                  {(assignedStaffName?.charAt(0) || 'M').toUpperCase()}
                </span>

                <div>
                  <strong>
                    {assignedStaffName || 'Assigned staff'}
                  </strong>

                  <span>Verified by the backend assignment</span>
                </div>
              </div>

              <div className="staff-detail-divider" />

              <div className="staff-detail-side-row">
                <span>Current Status</span>
                <StatusBadge status={status} />
              </div>

              <div className="staff-detail-side-row">
                <span>Last Updated</span>
                <strong>
                  {formatDate(
                    complaint.updatedAt || complaint.createdAt
                  )}
                </strong>
              </div>

              {canStartWork && (
                <button
                  type="button"
                  className="staff-detail-primary"
                  disabled={isSaving}
                  onClick={startRepair}
                >
                  <Wrench size={17} />
                  {isSaving ? 'Saving...' : 'Start Repair'}
                </button>
              )}

              {canResolve && (
                <button
                  type="button"
                  className="staff-detail-primary"
                  disabled={
                    isSaving ||
                    repairPhotos.length === 0 ||
                    !resolutionNote.trim()
                  }
                  onClick={uploadRepairEvidence}
                >
                  <CheckCircle2 size={17} />
                  {isSaving
                    ? 'Uploading and Saving...'
                    : 'Submit Repair for Confirmation'}
                </button>
              )}

              {status === 'Closed' && (
                <div className="staff-detail-complete">
                  <CheckCircle2 size={19} />
                  <span>The student has confirmed this repair.</span>
                </div>
              )}

              <div className="staff-detail-help">
                <Info size={18} />

                <div>
                  <strong>Before completing work</strong>

                  <p>
                    Upload at least one repair photo and add a resolution
                    note. The complaint closes only after the student
                    confirms the repair.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}