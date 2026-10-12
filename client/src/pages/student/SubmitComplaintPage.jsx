import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  FileText,
  MapPin,
  Tag,
  AlertCircle,
  ImagePlus,
  CheckCircle2,
} from 'lucide-react'

import MainLayout from '../../components/layout/MainLayout'
import { createComplaint } from '../../services/complaintService.js'
import './SubmitComplaintPage.css'

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

const categories = [
  'Electrical',
  'Plumbing',
  'Furniture',
  'Cleanliness',
  'Internet',
  'Classroom',
  'Hostel',
  'Other',
]

const priorities = [
  {
    value: 'Low',
    label: 'Low',
    description: 'Minor issue; can wait',
  },
  {
    value: 'Medium',
    label: 'Medium',
    description: 'Needs attention soon',
  },
  {
    value: 'High',
    label: 'High',
    description: 'Urgent attention needed',
  },
]

export default function SubmitComplaintPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    description: '',
    priority: 'Medium',
  })

  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [imageError, setImageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Human-readable complaint reference ID.
  const [submittedComplaintId, setSubmittedComplaintId] = useState('')

  // MongoDB document ID used to open the complaint details page.
  const [submittedComplaintMongoId, setSubmittedComplaintMongoId] =
    useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Release temporary preview URLs when the component unmounts.
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.preview)
      })
    }
  }, [images])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
      submission: '',
    }))
  }

  function handleImageChange(event) {
    const selectedFiles = Array.from(event.target.files || [])
    const newImages = []
    const messages = []

    const availableSlots = MAX_IMAGES - images.length

    if (availableSlots <= 0) {
      setImageError(
        `You can upload a maximum of ${MAX_IMAGES} images.`
      )

      event.target.value = ''
      return
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        messages.push(
          `${file.name}: Only JPG, PNG, WEBP and GIF images are supported.`
        )
        continue
      }

      if (file.size === 0) {
        messages.push(`${file.name}: This image file is empty.`)
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        messages.push(
          `${file.name}: Image size must be 5 MB or less.`
        )
        continue
      }

      const alreadySelected = images.some(
        (image) =>
          image.name === file.name &&
          image.size === file.size &&
          image.lastModified === file.lastModified
      )

      const alreadyInSelection = newImages.some(
        (image) =>
          image.name === file.name &&
          image.size === file.size &&
          image.lastModified === file.lastModified
      )

      if (alreadySelected || alreadyInSelection) {
        messages.push(
          `${file.name}: This image is already selected.`
        )
        continue
      }

      if (newImages.length >= availableSlots) {
        messages.push(
          `You can upload a maximum of ${MAX_IMAGES} images.`
        )
        break
      }

      newImages.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        preview: URL.createObjectURL(file),
      })
    }

    setImages((previous) => [...previous, ...newImages])
    setImageError(messages.join(' '))

    // Allow the same file to be selected again after removal.
    event.target.value = ''
  }

  function removeImage(imageId) {
    setImages((previous) => {
      const imageToRemove = previous.find(
        (image) => image.id === imageId
      )

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }

      return previous.filter((image) => image.id !== imageId)
    })

    setImageError('')
  }

  function validateForm() {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a complaint title.'
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category.'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Please enter the issue location.'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please describe the issue.'
    } else if (formData.description.trim().length < 15) {
      newErrors.description =
        'Please provide at least 15 characters of detail.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) return

    setSuccessMessage('')
    setSubmittedComplaintId('')
    setSubmittedComplaintMongoId('')

    setErrors((previous) => ({
      ...previous,
      submission: '',
    }))

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Send text fields and image files to the backend.
      const complaintData = new FormData()

      complaintData.append('title', formData.title.trim())
      complaintData.append('category', formData.category)
      complaintData.append('location', formData.location.trim())
      complaintData.append(
        'description',
        formData.description.trim()
      )
      complaintData.append('priority', formData.priority)

      images.forEach((image) => {
        complaintData.append('images', image.file)
      })

      // Backend creates the MongoDB record and uploads images
      // to Cloudinary.
      const response = await createComplaint(complaintData)
      const complaint = response?.complaint

      if (!complaint) {
        throw new Error(
          'The server did not return the created complaint. Please refresh your complaints list before submitting again.'
        )
      }

      /*
       * IMPORTANT:
       * _id is the MongoDB document ID used by the details API.
       * complaintId is the human-readable reference number.
       */
      const mongoId = complaint._id || complaint.id || ''
      const referenceId =
        complaint.complaintId || mongoId

      if (!mongoId) {
        throw new Error(
          'Complaint was submitted, but the server did not return its database ID. Please open My Complaints to check the saved complaint.'
        )
      }

      setSubmittedComplaintMongoId(mongoId)
      setSubmittedComplaintId(referenceId)

      setSuccessMessage(
        response.message ||
          'Your complaint has been submitted successfully.'
      )

      setFormData({
        title: '',
        category: '',
        location: '',
        description: '',
        priority: 'Medium',
      })

      setImages([])
      setErrors({})
      setImageError('')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      console.error('Complaint submission failed:', error)

      setErrors((previous) => ({
        ...previous,
        submission:
          error.message ||
          'Unable to submit your complaint. Please try again.',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleViewComplaint() {
    if (!submittedComplaintMongoId) {
      setErrors((previous) => ({
        ...previous,
        submission:
          'Complaint database ID is unavailable. Open My Complaints and select the submitted complaint.',
      }))

      return
    }

    navigate(
      `/student/complaints/${encodeURIComponent(
        submittedComplaintMongoId
      )}`
    )
  }

  return (
    <MainLayout>
      <div className="submit-complaint-page">
        <button
          type="button"
          className="complaint-back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={17} />
          <span>Back to Dashboard</span>
        </button>

        <div className="complaint-page-heading">
          <div>
            <span className="complaint-eyebrow">
              <FileText size={15} />
              CAMPUS SUPPORT
            </span>

            <h1>Report an Issue</h1>

            <p>
              Spotted something that needs fixing? Tell us about it.
              We'll help get it sorted.
            </p>
          </div>

          <div className="complaint-heading-icon">
            <FileText size={31} strokeWidth={1.6} />
          </div>
        </div>

        {successMessage && (
          <div className="complaint-success-message" role="status">
            <CheckCircle2 size={22} />

            <div>
              <strong>Complaint submitted!</strong>

              <p>
                {successMessage}
                {submittedComplaintId &&
                  ` Reference ID: ${submittedComplaintId}`}
              </p>

              {submittedComplaintMongoId && (
                <button
                  type="button"
                  className="complaint-view-submission"
                  onClick={handleViewComplaint}
                >
                  View Complaint
                  <ArrowRight size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              aria-label="Dismiss success message"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <form
          className="complaint-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* ISSUE DETAILS */}

          <section className="complaint-form-section">
            <div className="complaint-section-heading">
              <span className="complaint-section-icon">
                <FileText size={19} />
              </span>

              <div>
                <h2>Issue Details</h2>
                <p>
                  Give us the basic information about the problem.
                </p>
              </div>
            </div>

            <div className="complaint-form-grid">
              <div className="complaint-field complaint-field-full">
                <label htmlFor="title">
                  Complaint Title <span>*</span>
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Broken fan in classroom"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={100}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? 'title-error' : undefined
                  }
                />

                {errors.title && (
                  <small id="title-error" className="complaint-error">
                    {errors.title}
                  </small>
                )}
              </div>

              <div className="complaint-field">
                <label htmlFor="category">
                  Category <span>*</span>
                </label>

                <div className="complaint-input-with-icon">
                  <Tag size={17} />

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.category)}
                    aria-describedby={
                      errors.category ? 'category-error' : undefined
                    }
                  >
                    <option value="">Select a category</option>

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.category && (
                  <small
                    id="category-error"
                    className="complaint-error"
                  >
                    {errors.category}
                  </small>
                )}
              </div>

              <div className="complaint-field">
                <label htmlFor="location">
                  Issue Location <span>*</span>
                </label>

                <div className="complaint-input-with-icon">
                  <MapPin size={17} />

                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g. Block A, Room 204"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={150}
                    aria-invalid={Boolean(errors.location)}
                    aria-describedby={
                      errors.location ? 'location-error' : undefined
                    }
                  />
                </div>

                {errors.location && (
                  <small
                    id="location-error"
                    className="complaint-error"
                  >
                    {errors.location}
                  </small>
                )}
              </div>

              <div className="complaint-field complaint-field-full">
                <label htmlFor="description">
                  Describe the Issue <span>*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  placeholder="Explain what happened, where you noticed it, and any details that could help resolve the issue..."
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={1000}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description
                      ? 'description-error'
                      : undefined
                  }
                />

                <div className="complaint-field-footer">
                  {errors.description ? (
                    <small
                      id="description-error"
                      className="complaint-error"
                    >
                      {errors.description}
                    </small>
                  ) : (
                    <small>
                      Please provide enough detail to help us
                      understand the problem.
                    </small>
                  )}

                  <small>
                    {formData.description.length}/1000
                  </small>
                </div>
              </div>
            </div>
          </section>

          {/* PRIORITY */}

          <section className="complaint-form-section">
            <div className="complaint-section-heading">
              <span className="complaint-section-icon">
                <AlertCircle size={19} />
              </span>

              <div>
                <h2>Priority Level</h2>
                <p>
                  How urgently does this issue need attention?
                </p>
              </div>
            </div>

            <div className="complaint-priority-options">
              {priorities.map((priority) => (
                <label
                  key={priority.value}
                  className={`complaint-priority-option ${
                    formData.priority === priority.value
                      ? `is-selected priority-${priority.value.toLowerCase()}`
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={formData.priority === priority.value}
                    onChange={handleChange}
                  />

                  <span className="complaint-priority-radio" />

                  <span className="complaint-priority-copy">
                    <strong>{priority.label}</strong>
                    <small>{priority.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* IMAGE UPLOAD */}

          <section className="complaint-form-section">
            <div className="complaint-section-heading">
              <span className="complaint-section-icon">
                <ImagePlus size={19} />
              </span>

              <div>
                <h2>Add Photos</h2>
                <p>
                  Photos help us understand the issue. This step is
                  optional.
                </p>
              </div>
            </div>

            <div className="complaint-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageChange}
                disabled={images.length >= MAX_IMAGES}
                aria-label="Choose complaint photos"
              />

              <span className="complaint-upload-icon">
                <Upload size={22} />
              </span>

              <strong>
                {images.length >= MAX_IMAGES
                  ? 'Maximum 5 photos selected'
                  : 'Click to upload photos'}
              </strong>

              <span>
                JPG, PNG, WEBP or GIF · Up to 5 photos · 5 MB each
              </span>

              <button
                type="button"
                className="complaint-choose-images-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
              >
                <ImagePlus size={16} />
                Choose Images
              </button>
            </div>

            {imageError && (
              <p className="complaint-image-error" role="alert">
                {imageError}
              </p>
            )}

            {images.length > 0 && (
              <div className="complaint-selected-files">
                <div className="complaint-image-preview-heading">
                  <strong>Selected Photos</strong>

                  <span>
                    {images.length}/{MAX_IMAGES} images
                  </span>
                </div>

                <div className="complaint-image-preview-grid">
                  {images.map((image) => (
                    <article
                      className="complaint-image-preview-card"
                      key={image.id}
                    >
                      <img src={image.preview} alt={image.name} />

                      <button
                        type="button"
                        className="complaint-remove-image-button"
                        onClick={() => removeImage(image.id)}
                        aria-label={`Remove ${image.name}`}
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>

                      <div className="complaint-image-preview-info">
                        <span title={image.name}>
                          {image.name}
                        </span>

                        <small>
                          {(image.size / (1024 * 1024)).toFixed(2)} MB
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="complaint-photo-tip">
              <AlertCircle size={16} />

              <p>
                Please avoid including personal documents or
                identifiable faces unless necessary for reporting
                the issue.
              </p>
            </div>
          </section>

          {/* SUBMISSION ERROR */}

          {errors.submission && (
            <div
              className="complaint-error complaint-submission-error"
              role="alert"
            >
              {errors.submission}
            </div>
          )}

          {/* FORM ACTIONS */}

          <div className="complaint-form-footer">
            <p>
              <span>*</span> Required fields
            </p>

            <div className="complaint-form-actions">
              <button
                type="button"
                className="complaint-cancel-button"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="complaint-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Submitting...'
                  : 'Submit Complaint'}

                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </form>

        <div className="complaint-help-note">
          <AlertCircle size={18} />

          <p>
            <strong>Need immediate assistance?</strong> For
            emergencies, contact your campus administration directly.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}