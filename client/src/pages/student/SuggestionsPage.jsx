import { useCallback, useEffect, useState } from 'react'

import {
  Lightbulb,
  Plus,
  Send,
  Search,
  ThumbsUp,
  Clock3,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Inbox,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

import MainLayout from '../../components/layout/MainLayout'

import {
  createSuggestion,
  getSuggestions,
  voteForSuggestion,
} from '../../services/suggestionService.js'

import './SuggestionsPage.css'

const categories = [
  'Campus Facilities',
  'Cleanliness',
  'Library',
  'Cafeteria',
  'Internet & Wi-Fi',
  'Sports & Recreation',
  'Safety & Security',
  'Other',
]

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

function getSuggestionStatusClass(status) {
  const normalized = String(status || 'Submitted')
    .trim()
    .toLowerCase()

  if (
    normalized === 'implemented' ||
    normalized === 'completed'
  ) {
    return 'implemented'
  }

  if (
    normalized === 'under review' ||
    normalized === 'in progress'
  ) {
    return 'review'
  }

  return 'submitted'
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const [showForm, setShowForm] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [votingId, setVotingId] = useState('')

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
  })

  // ==========================================
  // LOAD ANONYMOUS SUGGESTIONS FROM BACKEND
  // ==========================================

  const loadSuggestions = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await getSuggestions()

      const records = response?.suggestions

      if (!Array.isArray(records)) {
        throw new Error(
          'Invalid suggestions response received from server.'
        )
      }

      setSuggestions(records)
    } catch (error) {
      console.error('Load suggestions error:', error)

      setErrorMessage(
        error.message || 'Unable to load suggestions.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  // ==========================================
  // STATISTICS
  // ==========================================

  const counts = {
    All: suggestions.length,

    Submitted: suggestions.filter(
      (item) =>
        getSuggestionStatusClass(item.status) === 'submitted'
    ).length,

    'Under Review': suggestions.filter(
      (item) =>
        getSuggestionStatusClass(item.status) === 'review'
    ).length,

    Implemented: suggestions.filter(
      (item) =>
        getSuggestionStatusClass(item.status) === 'implemented'
    ).length,
  }

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const filteredSuggestions = suggestions.filter(
    (suggestion) => {
      const statusClass = getSuggestionStatusClass(
        suggestion.status
      )

      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Submitted' &&
          statusClass === 'submitted') ||
        (activeFilter === 'Under Review' &&
          statusClass === 'review') ||
        (activeFilter === 'Implemented' &&
          statusClass === 'implemented')

      const query = searchTerm.trim().toLowerCase()

      const matchesSearch =
        !query ||
        [
          suggestion.title,
          suggestion.category,
          suggestion.description,
          suggestion.suggestionId,
          suggestion.id,
        ].some((value) =>
          String(value || '').toLowerCase().includes(query)
        )

      return matchesFilter && matchesSearch
    }
  )

  // ==========================================
  // FORM CHANGE
  // ==========================================

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrorMessage('')
  }

  // ==========================================
  // SUBMIT AN ANONYMOUS SUGGESTION
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    const title = formData.title.trim()
    const category = formData.category
    const description = formData.description.trim()

    if (!title || !category || !description) {
      setErrorMessage(
        'Please fill in all required fields.'
      )
      return
    }

    if (description.length < 15) {
      setErrorMessage(
        'Please describe your suggestion in at least 15 characters.'
      )
      return
    }

    try {
      setIsSubmitting(true)

      await createSuggestion({
        title,
        category,
        description,
      })

      setFormData({
        title: '',
        category: '',
        description: '',
      })

      setShowForm(false)
      setActiveFilter('All')
      setSearchTerm('')

      await loadSuggestions()

      setSuccessMessage(
        'Your anonymous suggestion has been submitted successfully!'
      )
    } catch (error) {
      console.error('Submit suggestion error:', error)

      setErrorMessage(
        error.message || 'Unable to submit your suggestion.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================
  // SUPPORT AN IDEA
  // ==========================================

  async function handleVote(suggestion) {
    const suggestionMongoId = suggestion._id

    if (!suggestionMongoId) {
      setErrorMessage(
        'Unable to identify this suggestion. Please refresh the page.'
      )
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setVotingId(suggestionMongoId)

    try {
      await voteForSuggestion(suggestionMongoId)

      await loadSuggestions()

      setSuccessMessage(
        'Your support has been recorded!'
      )
    } catch (error) {
      console.error('Vote suggestion error:', error)

      setErrorMessage(
        error.message || 'Unable to support this suggestion.'
      )
    } finally {
      setVotingId('')
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <MainLayout>
      <div className="campus-suggestions-page">

        {/* PAGE HEADER */}

        <header className="suggestions-page-heading">
          <div>
            <span className="suggestions-eyebrow">
              <Lightbulb size={15} />
              YOUR IDEAS MATTER
            </span>

            <h1>Campus Suggestions</h1>

            <p>
              Share ideas to improve our campus.
              Your identity will not be displayed.
            </p>
          </div>

          <button
            type="button"
            className="suggestions-create-button"
            onClick={() => {
              setShowForm((previous) => !previous)
              setErrorMessage('')
              setSuccessMessage('')
            }}
          >
            {showForm ? (
              <X size={17} />
            ) : (
              <Plus size={18} />
            )}

            {showForm ? 'Cancel' : 'Share an Idea'}
          </button>
        </header>

        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <div
            className="suggestions-success-message"
            role="status"
          >
            <CheckCircle2 size={20} />

            <span>{successMessage}</span>

            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ERROR MESSAGE */}

        {errorMessage && (
          <div
            className="suggestions-error-message"
            role="alert"
          >
            <AlertCircle size={18} />

            <span>{errorMessage}</span>

            <button
              type="button"
              onClick={() => setErrorMessage('')}
              aria-label="Dismiss error message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* HERO */}

        <section className="suggestions-hero">
          <div className="suggestions-hero-content">
            <span className="suggestions-hero-label">
              <Sparkles size={15} />
              SMALL IDEAS, BIG IMPACT
            </span>

            <h2>
              Let's build a better campus together.
            </h2>

            <p>
              Every great campus improvement starts with
              an idea. Share yours anonymously and help
              create a better experience for everyone.
            </p>

            <button
              type="button"
              className="suggestions-hero-button"
              onClick={() => {
                setShowForm(true)
                setErrorMessage('')
                setSuccessMessage('')
              }}
            >
              <Lightbulb size={17} />
              Submit Your Idea
            </button>
          </div>

          <div className="suggestions-hero-art">
            <span className="suggestions-art-circle suggestions-art-circle-one" />

            <span className="suggestions-art-circle suggestions-art-circle-two" />

            <div className="suggestions-bulb">
              <Lightbulb
                size={54}
                strokeWidth={1.5}
              />
            </div>

            <span className="suggestions-art-spark spark-one">
              ✦
            </span>

            <span className="suggestions-art-spark spark-two">
              ✧
            </span>

            <span className="suggestions-art-spark spark-three">
              ✦
            </span>
          </div>
        </section>

        {/* SUGGESTION FORM */}

        {showForm && (
          <section className="suggestions-form-card">
            <div className="suggestions-form-heading">
              <span className="suggestions-section-icon">
                <MessageSquare size={19} />
              </span>

              <div>
                <h2>Share Your Suggestion</h2>

                <p>
                  Your name and email will not be displayed
                  with your suggestion.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="suggestions-form-grid">

                <div className="suggestions-field suggestions-field-full">
                  <label htmlFor="suggestion-title">
                    Suggestion Title <span>*</span>
                  </label>

                  <input
                    id="suggestion-title"
                    name="title"
                    type="text"
                    placeholder="e.g. Add more drinking water facilities"
                    maxLength={100}
                    value={formData.title}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="suggestions-field suggestions-field-full">
                  <label htmlFor="suggestion-category">
                    Category <span>*</span>
                  </label>

                  <select
                    id="suggestion-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="">
                      Choose a category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="suggestions-field suggestions-field-full">
                  <label htmlFor="suggestion-description">
                    Describe Your Idea <span>*</span>
                  </label>

                  <textarea
                    id="suggestion-description"
                    name="description"
                    placeholder="What would you like to improve, and how would it help students?"
                    rows={5}
                    maxLength={1000}
                    value={formData.description}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />

                  <div className="suggestions-character-count">
                    <span>
                      Please include enough detail to explain your idea.
                    </span>

                    <span>
                      {formData.description.length}/1000
                    </span>
                  </div>
                </div>

              </div>

              <div className="suggestions-form-footer">
                <p>
                  <span>*</span> Required fields
                </p>

                <button
                  type="submit"
                  className="suggestions-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : 'Submit Suggestion'}

                  {isSubmitting ? (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* STATISTICS */}

        <section className="suggestions-stats">
          <article className="suggestions-stat-card">
            <span className="suggestions-stat-icon suggestions-stat-total">
              <Lightbulb size={21} />
            </span>

            <div>
              <p>Total Suggestions</p>
              <strong>{counts.All}</strong>
            </div>
          </article>

          <article className="suggestions-stat-card">
            <span className="suggestions-stat-icon suggestions-stat-submitted">
              <Clock3 size={21} />
            </span>

            <div>
              <p>Submitted</p>
              <strong>{counts.Submitted}</strong>
            </div>
          </article>

          <article className="suggestions-stat-card">
            <span className="suggestions-stat-icon suggestions-stat-review">
              <MessageSquare size={21} />
            </span>

            <div>
              <p>Under Review</p>
              <strong>{counts['Under Review']}</strong>
            </div>
          </article>

          <article className="suggestions-stat-card">
            <span className="suggestions-stat-icon suggestions-stat-done">
              <CheckCircle2 size={21} />
            </span>

            <div>
              <p>Implemented</p>
              <strong>{counts.Implemented}</strong>
            </div>
          </article>
        </section>

        {/* COMMUNITY IDEAS */}

        <section className="suggestions-content">
          <div className="suggestions-toolbar">
            <div>
              <h2>Community Ideas</h2>

              <p>
                {isLoading
                  ? 'Loading suggestions...'
                  : `${filteredSuggestions.length} ${
                      filteredSuggestions.length === 1
                        ? 'suggestion'
                        : 'suggestions'
                    } found`}
              </p>
            </div>

            <label className="suggestions-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search ideas..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                disabled={isLoading}
              />
            </label>
          </div>

          {/* FILTERS */}

          <div className="suggestions-filters">
            {[
              'All',
              'Submitted',
              'Under Review',
              'Implemented',
            ].map((filter) => (
              <button
                type="button"
                key={filter}
                className={`suggestions-filter ${
                  activeFilter === filter
                    ? 'active'
                    : ''
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}

                <span>{counts[filter]}</span>
              </button>
            ))}
          </div>

          {/* LOADING */}

          {isLoading ? (
            <div className="suggestions-empty">
              <RefreshCw
                size={30}
                className="animate-spin"
              />

              <h3>Loading community ideas...</h3>

              <p>
                Please wait while we retrieve suggestions.
              </p>
            </div>
          ) : errorMessage && suggestions.length === 0 ? (
            /* ERROR */

            <div className="suggestions-empty">
              <AlertCircle size={30} />

              <h3>Unable to load suggestions</h3>

              <p>{errorMessage}</p>

              <button
                type="button"
                className="suggestions-create-button"
                onClick={loadSuggestions}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          ) : filteredSuggestions.length > 0 ? (
            /* SUGGESTION CARDS */

            <div className="suggestions-list">
              {filteredSuggestions.map((suggestion) => {
                const statusClass =
                  getSuggestionStatusClass(
                    suggestion.status
                  )

                const suggestionKey =
                  suggestion._id ||
                  suggestion.suggestionId

                const hasVoted = Boolean(
                  suggestion.voted
                )

                return (
                  <article
                    className="suggestion-card"
                    key={suggestionKey}
                  >
                    <div className="suggestion-card-main">
                      <span className="suggestion-card-icon">
                        <Lightbulb size={22} />
                      </span>

                      <div className="suggestion-card-content">
                        <div className="suggestion-card-topline">
                          <span className="suggestion-id">
                            {suggestion.suggestionId ||
                              suggestion.id ||
                              'Suggestion'}
                          </span>

                          <span
                            className={`suggestion-status status-${statusClass}`}
                          >
                            {suggestion.status ||
                              'Submitted'}
                          </span>
                        </div>

                        <h3>{suggestion.title}</h3>

                        <p>{suggestion.description}</p>

                        <div className="suggestion-metadata">
                          <span>
                            {suggestion.category}
                          </span>

                          <span>
                            {formatDate(
                              suggestion.createdAt
                            )}
                          </span>

                          <span>
                            Anonymous
                          </span>
                        </div>

                        {suggestion.adminResponse && (
                          <div className="suggestion-admin-response">
                            <strong>
                              Admin response
                            </strong>

                            <p>
                              {suggestion.adminResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="suggestion-card-footer">
                      <span className="suggestion-vote-count">
                        <ThumbsUp size={15} />

                        {suggestion.votes || 0} votes
                      </span>

                      <button
                        type="button"
                        className={`suggestion-vote-button ${
                          hasVoted ? 'voted' : ''
                        }`}
                        disabled={
                          hasVoted ||
                          votingId === suggestion._id ||
                          !suggestion._id
                        }
                        onClick={() =>
                          handleVote(suggestion)
                        }
                      >
                        {votingId === suggestion._id ? (
                          <RefreshCw
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <ThumbsUp size={15} />
                        )}

                        {votingId === suggestion._id
                          ? 'Saving...'
                          : hasVoted
                            ? 'Supported'
                            : 'Support Idea'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            /* EMPTY STATE */

            <div className="suggestions-empty">
              <span className="suggestions-empty-icon">
                <Inbox size={30} />
              </span>

              <h3>
                {searchTerm || activeFilter !== 'All'
                  ? 'No matching suggestions'
                  : 'No ideas shared yet'}
              </h3>

              <p>
                {searchTerm || activeFilter !== 'All'
                  ? 'Try a different search term or filter.'
                  : 'Be the first to share an idea that could improve your campus.'}
              </p>

              {!searchTerm &&
                activeFilter === 'All' && (
                  <button
                    type="button"
                    className="suggestions-create-button"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus size={17} />
                    Share the First Idea
                  </button>
                )}
            </div>
          )}
        </section>

        {/* PRIVACY NOTE */}

        <div className="suggestions-note">
          <Lightbulb size={18} />

          <p>
            <strong>Your voice matters.</strong>{' '}
            Suggestions are shared anonymously. Student
            names, email addresses, and college IDs should
            never be displayed with suggestions.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}