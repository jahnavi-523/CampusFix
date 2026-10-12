// Complaint form.
import { useRef, useState } from 'react'
import {
  FileText,
  Tag,
  MapPin,
  AlertTriangle,
  Upload,
  ImagePlus,
  X,
  Send,
  LoaderCircle,
} from 'lucide-react'

import './ComplaintForm.css'

const categories = [
  'Electrical',
  'Plumbing',
  'Furniture',
  'Cleanliness',
  'Internet & Wi-Fi',
  'Classroom',
  'Laboratory',
  'Washroom',
  'Other',
]

const priorities = [
  {
    value: 'Low',
    description: 'Minor issue; can wait',
  },
  {
    value: 'Medium',
    description: 'Needs attention soon',
  },
  {
    value: 'High',
    description: 'Urgent attention needed',
  },
]

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function ComplaintForm({ onSubmit, submitting = false }) {
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    description: '',
    priority: 'Medium',
  })

  const [images, setImages] = useState([])
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
  }

  function handleImageSelection(event) {
    const selectedFiles = Array.from(event.target.files || [])

    setImageError('')

    const remainingSlots = MAX_IMAGES - images.length

    if (remainingSlots <= 0) {
      setImageError(`You can upload a maximum of ${MAX_IMAGES} images.`)
      event.target.value = ''
      return
    }

    const validImages = []
    const errors = []

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Please select an image file.`)
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Image size must be 5 MB or less.`)
        continue
      }

      if (images.some((image) => image.name === file.name && image.size === file.size)) {
        errors.push(`${file.name}: This image is already selected.`)
        continue
      }

      if (validImages.length >= remainingSlots) {
        errors.push(`You can upload a maximum of ${MAX_IMAGES} images.`)
        break
      }

      validImages.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        size: file.size,
        file,
        preview: URL.createObjectURL(file),
      })
    }

    if (errors.length > 0) {
      setImageError(errors.join(' '))
    }

    setImages((previous) => [...previous, ...validImages])

    // Allows the same file to be selected again after removing it.
    event.target.value = ''
  }

  function removeImage(imageId) {
    setImages((previous) => {
      const imageToRemove = previous.find((image) => image.id === imageId)

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }

      return previous.filter((image) => image.id !== imageId)
    })

    setImageError('')
  }

  function validateForm() {
    if (!formData.title.trim()) {
      return 'Please enter a complaint title.'
    }

    if (!formData.category) {
      return 'Please select a complaint category.'
    }

    if (!formData.location.trim()) {
      return 'Please enter the issue location.'
    }

    if (!formData.description.trim()) {
      return 'Please describe the issue.'
    }

    if (formData.description.trim().length < 10) {
      return 'Please describe the issue in at least 10 characters.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    if (typeof onSubmit !== 'function') {
      setError(
        'Complaint submission is not connected yet. Please connect the form to your complaint handler.'
      )
      return
    }

    setError('')

    try {
      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        images: images.map((image) => image.file),
      })
    } catch (submissionError) {
      setError(
        submissionError?.message ||
          'Unable to submit your complaint. Please try again.'
      )
    }
  }

  return (
    <form className="campus-complaint-form" onSubmit={handleSubmit}>
      <section className="complaint-form-section">
        <div className="complaint-form-section-heading">
          <span className="complaint-form-section-icon">
            <FileText size={19} />
          </span>

          <div>
            <h2>Issue Details</h2>
            <p>Give us the basic information about the problem.</p>
          </div>
        </div>

        <div className="complaint-form-grid">
          <div className="complaint-form-field full-width">
            <label htmlFor="complaint-title">
              Complaint Title <span>*</span>
            </label>

            <input
              id="complaint-title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Broken fan in classroom"
              maxLength={100}
              required
            />
          </div>

          <div className="complaint-form-field">
            <label htmlFor="complaint-category">
              Category <span>*</span>
            </label>

            <div className="complaint-form-input-with-icon">
              <Tag size={17} />

              <select
                id="complaint-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="complaint-form-field">
            <label htmlFor="complaint-location">
              Issue Location <span>*</span>
            </label>

            <div className="complaint-form-input-with-icon">
              <MapPin size={17} />

              <input
                id="complaint-location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Block A, Room 204"
                maxLength={150}
                required
              />
            </div>
          </div>

          <div className="complaint-form-field full-width">
            <label htmlFor="complaint-description">
              Describe the Issue <span>*</span>
            </label>

            <textarea
              id="complaint-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Explain what happened, where you noticed it, and any details that could help resolve the issue..."
              maxLength={1000}
              rows={5}
              required
            />

            <div className="complaint-form-character-count">
              <span>
                Please provide enough detail to help us understand the
                problem.
              </span>

              <span>{formData.description.length}/1000</span>
            </div>
          </div>
        </div>
      </section>

      <section className="complaint-form-section">
        <div className="complaint-form-section-heading">
          <span className="complaint-form-section-icon">
            <AlertTriangle size={19} />
          </span>

          <div>
            <h2>Priority Level</h2>
            <p>How urgently does this issue need attention?</p>
          </div>
        </div>

        <div className="complaint-priority-options">
          {priorities.map((priority) => (
            <label
              key={priority.value}
              className={`complaint-priority-option priority-${priority.value.toLowerCase()} ${
                formData.priority === priority.value ? 'selected' : ''
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
                <strong>{priority.value}</strong>
                <small>{priority.description}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="complaint-form-section">
        <div className="complaint-form-section-heading">
          <span className="complaint-form-section-icon">
            <ImagePlus size={19} />
          </span>

          <div>
            <h2>Issue Photos</h2>
            <p>
              Add photos to help the campus team understand the problem.
            </p>
          </div>
        </div>

        <div className="complaint-upload-area">
          <input
            ref={fileInputRef}
            className="complaint-hidden-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleImageSelection}
            aria-label="Choose complaint photos"
          />

          <div className="complaint-upload-icon">
            <Upload size={23} />
          </div>

          <h3>Upload issue photos</h3>

          <p>
            Select images from your device. JPG, PNG, WEBP or GIF.
          </p>

          <button
            type="button"
            className="complaint-choose-images-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
          >
            <ImagePlus size={16} />
            Choose Images
          </button>

          <span className="complaint-upload-limit">
            Up to {MAX_IMAGES} images · 5 MB per image
          </span>
        </div>

        {imageError && (
          <p className="complaint-image-error" role="alert">
            {imageError}
          </p>
        )}

        {images.length > 0 && (
          <div className="complaint-image-preview-section">
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
                    <span title={image.name}>{image.name}</span>

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
          <AlertTriangle size={16} />

          <p>
            Please avoid including personal documents or identifiable
            faces unless necessary for reporting the issue.
          </p>
        </div>
      </section>

      {error && (
        <div className="complaint-form-error" role="alert">
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="complaint-form-submit-area">
        <p>
          <span>*</span> Required fields
        </p>

        <button
          type="submit"
          className="complaint-submit-button"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <LoaderCircle className="complaint-submit-spinner" size={17} />
              Submitting...
            </>
          ) : (
            <>
              Submit Complaint
              <Send size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  )
}