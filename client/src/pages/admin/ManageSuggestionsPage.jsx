import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Lightbulb,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock3,
  MessageSquare,
  AlertCircle,
  CalendarDays,
  X,
  Save,
  Leaf,
} from 'lucide-react'
import { getAllSuggestions, updateSuggestionStatus } from '../../services/suggestionService.js'

import './ManageSuggestionsPage.css'

const STATUSES = [
  'Submitted',
  'Under Review',
  'Implemented',
  'Rejected',
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

export default function ManageSuggestionsPage() {
  const navigate = useNavigate()

  const [suggestions, setSuggestions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const [isLoading, setIsLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [selectedSuggestion, setSelectedSuggestion] =
    useState(null)

  const [editStatus, setEditStatus] = useState('Submitted')
  const [adminResponse, setAdminResponse] = useState('')

  const loadSuggestions = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await getAllSuggestions()

      if (!Array.isArray(response?.suggestions)) {
        throw new Error(
          'Invalid suggestions response received from server.'
        )
      }

      // Do not put student identity in admin page state.
      const anonymousSuggestions = response.suggestions.map(
        (item) => ({
          _id: item._id,
          suggestionId: item.suggestionId,
          title: item.title,
          category: item.category,
          description: item.description,
          status: item.status || 'Submitted',
          votes: item.votes || 0,
          adminResponse: item.adminResponse || '',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })
      )

      setSuggestions(anonymousSuggestions)
    } catch (error) {
      console.error('Admin suggestions loading error:', error)

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

  const counts = {
    All: suggestions.length,
    Submitted: suggestions.filter(
      (item) => item.status === 'Submitted'
    ).length,
    'Under Review': suggestions.filter(
      (item) => item.status === 'Under Review'
    ).length,
    Implemented: suggestions.filter(
      (item) => item.status === 'Implemented'
    ).length,
    Rejected: suggestions.filter(
      (item) => item.status === 'Rejected'
    ).length,
  }

  const filteredSuggestions = suggestions.filter((item) => {
    const matchesFilter =
      activeFilter === 'All' || item.status === activeFilter

    const query = searchTerm.trim().toLowerCase()

    const matchesSearch =
      !query ||
      [
        item.suggestionId,
        item.title,
        item.category,
        item.description,
        item.status,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )

    return matchesFilter && matchesSearch
  })

  function openSuggestion(suggestion) {
    setSelectedSuggestion(suggestion)
    setEditStatus(suggestion.status)
    setAdminResponse(suggestion.adminResponse || '')
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function handleSaveStatus(event) {
    event.preventDefault()

    if (!selectedSuggestion?._id) {
      setErrorMessage('Invalid suggestion reference.')
      return
    }

    try {
      setSavingId(selectedSuggestion._id)
      setErrorMessage('')
      setSuccessMessage('')

      const response = await updateSuggestionStatus(
        selectedSuggestion._id,
        editStatus,
        adminResponse
      )

      const updated = response?.suggestion

      setSuggestions((previous) =>
        previous.map((item) =>
          item._id === selectedSuggestion._id
            ? {
                ...item,
                status: updated?.status || editStatus,
                adminResponse:
                  updated?.adminResponse ?? adminResponse.trim(),
                updatedAt: updated?.updatedAt || new Date().toISOString(),
              }
            : item
        )
      )

      setSelectedSuggestion((previous) =>
        previous
          ? {
              ...previous,
              status: updated?.status || editStatus,
              adminResponse:
                updated?.adminResponse ?? adminResponse.trim(),
            }
          : null
      )

      setSuccessMessage('Suggestion updated successfully.')
    } catch (error) {
      console.error('Update suggestion error:', error)

      setErrorMessage(
        error.message || 'Unable to update suggestion.'
      )
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="manage-suggestions-page">
      <header className="manage-suggestions-header">
        <div className="manage-suggestions-brand">
          <span className="manage-suggestions-brand-icon">
            <Leaf size={22} />
          </span>

          <span>
            Campus<span>Fix</span>
          </span>
        </div>

        <button
          type="button"
          className="manage-suggestions-back"
          onClick={() => navigate('/admin/dashboard')}
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>
      </header>

      <main className="manage-suggestions-main">
        <section className="manage-suggestions-intro">
          <div>
            <span className="manage-suggestions-eyebrow">
              <Lightbulb size={15} />
              ADMINISTRATION
            </span>

            <h1>Student Suggestions</h1>

            <p>
              Review anonymous campus ideas and update their
              progress. Student identities are not displayed.
            </p>
          </div>

          <button
            type="button"
            className="manage-suggestions-refresh"
            onClick={loadSuggestions}
            disabled={isLoading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </section>

        {errorMessage && (
          <div
            className="manage-suggestions-alert error"
            role="alert"
          >
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            className="manage-suggestions-alert success"
            role="status"
          >
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        <section className="manage-suggestions-stats">
          <article>
            <span className="manage-suggestions-stat-icon total">
              <Lightbulb size={21} />
            </span>
            <div>
              <p>Total Ideas</p>
              <strong>{counts.All}</strong>
            </div>
          </article>

          <article>
            <span className="manage-suggestions-stat-icon pending">
              <Clock3 size={21} />
            </span>
            <div>
              <p>Submitted</p>
              <strong>{counts.Submitted}</strong>
            </div>
          </article>

          <article>
            <span className="manage-suggestions-stat-icon review">
              <MessageSquare size={21} />
            </span>
            <div>
              <p>Under Review</p>
              <strong>{counts['Under Review']}</strong>
            </div>
          </article>

          <article>
            <span className="manage-suggestions-stat-icon done">
              <CheckCircle2 size={21} />
            </span>
            <div>
              <p>Implemented</p>
              <strong>{counts.Implemented}</strong>
            </div>
          </article>
        </section>

        <section className="manage-suggestions-content">
          <div className="manage-suggestions-toolbar">
            <div>
              <h2>Community Ideas</h2>
              <p>
                {filteredSuggestions.length} suggestions
              </p>
            </div>

            <label className="manage-suggestions-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search suggestions..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </label>
          </div>

          <div className="manage-suggestions-filters">
            {[
              'All',
              'Submitted',
              'Under Review',
              'Implemented',
              'Rejected',
            ].map((filter) => (
              <button
                key={filter}
                type="button"
                className={
                  activeFilter === filter ? 'active' : ''
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
                <span>{counts[filter]}</span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="manage-suggestions-empty">
              <RefreshCw size={27} className="animate-spin" />
              <h3>Loading suggestions...</h3>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="manage-suggestions-empty">
              <Lightbulb size={30} />

              <h3>
                {searchTerm || activeFilter !== 'All'
                  ? 'No matching suggestions'
                  : 'No suggestions submitted yet'}
              </h3>

              <p>
                New anonymous student suggestions will appear here.
              </p>
            </div>
          ) : (
            <div className="manage-suggestions-list">
              {filteredSuggestions.map((suggestion) => (
                <article
                  className="manage-suggestion-card"
                  key={suggestion._id}
                >
                  <div className="manage-suggestion-main">
                    <span className="manage-suggestion-icon">
                      <Lightbulb size={22} />
                    </span>

                    <div className="manage-suggestion-copy">
                      <div className="manage-suggestion-meta">
                        <span>
                          {suggestion.suggestionId || 'Suggestion'}
                        </span>

                        <span
                          className={`manage-suggestion-status status-${suggestion.status.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {suggestion.status}
                        </span>
                      </div>

                      <h3>{suggestion.title}</h3>

                      <p>{suggestion.description}</p>

                      <div className="manage-suggestion-details">
                        <span>{suggestion.category}</span>

                        <span>
                          <CalendarDays size={14} />
                          {formatDate(suggestion.createdAt)}
                        </span>

                        <span>
                          {suggestion.votes} votes
                        </span>

                        <span>Anonymous</span>
                      </div>

                      {suggestion.adminResponse && (
                        <div className="manage-suggestion-response">
                          <strong>Admin response</strong>
                          <p>{suggestion.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="manage-suggestion-review-button"
                    onClick={() => openSuggestion(suggestion)}
                  >
                    Review & Update
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="manage-suggestions-privacy">
          <Lightbulb size={18} />

          <p>
            Suggestions are displayed without student names,
            emails or college IDs.
          </p>
        </footer>
      </main>

      {selectedSuggestion && (
        <div
          className="manage-suggestion-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSuggestion(null)
              setErrorMessage('')
              setSuccessMessage('')
            }
          }}
        >
          <section
            className="manage-suggestion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-suggestion-modal-title"
          >
            <div className="manage-suggestion-modal-heading">
              <div>
                <span>ANONYMOUS SUGGESTION</span>

                <h2 id="manage-suggestion-modal-title">
                  Review Suggestion
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedSuggestion(null)
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="manage-suggestion-modal-body">
              <span className="manage-suggestion-modal-id">
                {selectedSuggestion.suggestionId}
              </span>

              <h3>{selectedSuggestion.title}</h3>

              <p>{selectedSuggestion.description}</p>

              <div className="manage-suggestion-modal-info">
                <span>
                  Category: {selectedSuggestion.category}
                </span>

                <span>
                  Submitted: {formatDate(selectedSuggestion.createdAt)}
                </span>

                <span>
                  Votes: {selectedSuggestion.votes}
                </span>
              </div>

              <form onSubmit={handleSaveStatus}>
                <label htmlFor="suggestion-status">
                  Update Status
                </label>

                <select
                  id="suggestion-status"
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(event.target.value)
                  }
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <label htmlFor="suggestion-admin-response">
                  Admin Response (optional)
                </label>

                <textarea
                  id="suggestion-admin-response"
                  value={adminResponse}
                  onChange={(event) =>
                    setAdminResponse(event.target.value)
                  }
                  maxLength={1000}
                  rows={4}
                  placeholder="Add an update for students..."
                />

                <div className="manage-suggestion-modal-actions">
                  <button
                    type="button"
                    className="manage-suggestion-cancel"
                    onClick={() => {
                      setSelectedSuggestion(null)
                      setErrorMessage('')
                      setSuccessMessage('')
                    }}
                    disabled={Boolean(savingId)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="manage-suggestion-save"
                    disabled={Boolean(savingId)}
                  >
                    {savingId === selectedSuggestion._id ? (
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={16} />
                    )}

                    {savingId === selectedSuggestion._id
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}