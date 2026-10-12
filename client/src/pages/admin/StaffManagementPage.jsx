import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Clock3,
  Building2,
  Mail,
  IdCard,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  getPendingStaff,
  approveStaff,
  rejectStaff,
} from '../../services/adminService.js'

import './StaffManagementPage.css'

export default function StaffManagementPage() {
  const navigate = useNavigate()

  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadPendingStaff = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getPendingStaff()
      setStaff(response?.staff || [])
    } catch (err) {
      setError(
        err.message || 'Unable to load pending staff registrations.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPendingStaff()
  }, [loadPendingStaff])

  const handleDecision = async (staffId, action) => {
    const actionLabel = action === 'approve' ? 'approve' : 'reject'

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this staff registration?`
    )

    if (!confirmed) return

    setProcessingId(staffId)
    setError('')
    setMessage('')

    try {
      const response =
        action === 'approve'
          ? await approveStaff(staffId)
          : await rejectStaff(staffId)

      setMessage(
        response?.message ||
          `Staff registration ${actionLabel === 'approve' ? 'approved' : 'rejected'} successfully.`
      )

      await loadPendingStaff()
    } catch (err) {
      setError(
        err.message ||
          `Unable to ${actionLabel} staff registration.`
      )
    } finally {
      setProcessingId('')
    }
  }

  return (
    <main className="staff-management-page">
      <div className="staff-management-container">

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="staff-back-button"
        >
          <ArrowLeft size={18} />
          Back to Admin Dashboard
        </button>

        {/* Header */}
        <header className="staff-management-header">
          <div>
            <span className="staff-management-eyebrow">
              CAMPUSFIX / ADMINISTRATION
            </span>

            <h1>Staff Management</h1>

            <p>
              Review staff registrations and manage account approvals.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPendingStaff}
            disabled={loading}
            className="staff-refresh-button"
          >
            <RefreshCw
              size={17}
              className={loading ? 'staff-refresh-spinning' : ''}
            />
            Refresh
          </button>
        </header>

        {/* Error message */}
        {error && (
          <div className="staff-management-error" role="alert">
            {error}
          </div>
        )}

        {/* Success message */}
        {message && (
          <div className="staff-management-success" role="status">
            {message}
          </div>
        )}

        {/* Pending summary */}
        <section className="staff-pending-summary">
          <div className="staff-pending-label">
            <div className="staff-pending-icon">
              <Users size={23} />
            </div>

            <div>
              <h2>Pending registrations</h2>
              <p>Staff accounts waiting for your approval</p>
            </div>
          </div>

          <span className="staff-pending-count">
            {staff.length}
          </span>
        </section>

        {/* Loading */}
        {loading ? (
          <div className="staff-management-state">
            <div className="staff-management-state-icon">
              <RefreshCw size={27} className="staff-refresh-spinning" />
            </div>

            <h2>Loading registrations</h2>

            <p>
              Please wait while we retrieve pending staff accounts.
            </p>
          </div>
        ) : staff.length === 0 ? (
          /* Empty state */
          <div className="staff-management-state">
            <div className="staff-management-state-icon">
              <CheckCircle size={30} />
            </div>

            <h2>No pending registrations</h2>

            <p>
              There are no staff accounts waiting for approval right now.
              New registration requests will appear here.
            </p>

            <button
              type="button"
              onClick={loadPendingStaff}
              className="staff-refresh-button"
              style={{ margin: '22px auto 0' }}
            >
              <RefreshCw size={16} />
              Check again
            </button>
          </div>
        ) : (
          /* Staff cards */
          <section className="staff-management-list">
            {staff.map((person) => {
              const staffId = person._id || person.id
              const isProcessing = processingId === staffId

              return (
                <article
                  key={staffId}
                  className="staff-management-card"
                >
                  <div className="staff-card-main">

                    {/* Staff identity */}
                    <div className="staff-card-identity">
                      <div className="staff-card-avatar">
                        {(person.name || 'S')
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h2 className="staff-card-name">
                          {person.name}
                        </h2>

                        <p className="staff-card-email">
                          {person.email}
                        </p>

                        <span className="staff-pending-badge">
                          <Clock3 size={13} />
                          Pending approval
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Staff details */}
                  <div className="staff-card-details">
                    <div className="staff-detail-item">
                      <span className="staff-detail-label">
                        <IdCard size={13} /> Staff ID
                      </span>

                      <span className="staff-detail-value">
                        {person.collegeId || 'Not provided'}
                      </span>
                    </div>

                    <div className="staff-detail-item">
                      <span className="staff-detail-label">
                        <Building2 size={13} /> Department
                      </span>

                      <span className="staff-detail-value">
                        {person.department || 'Not specified'}
                      </span>
                    </div>

                    <div className="staff-detail-item">
                      <span className="staff-detail-label">
                        <Mail size={13} /> Email address
                      </span>

                      <span className="staff-detail-value">
                        {person.email}
                      </span>
                    </div>

                    <div className="staff-detail-item">
                      <span className="staff-detail-label">
                        <Clock3 size={13} /> Registered on
                      </span>

                      <span className="staff-detail-value">
                        {person.createdAt
                          ? new Date(person.createdAt).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : 'Not available'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="staff-card-actions">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleDecision(staffId, 'approve')
                      }
                      className="staff-approve-button"
                    >
                      <CheckCircle size={17} />

                      {isProcessing
                        ? 'Processing...'
                        : 'Approve Staff'}
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleDecision(staffId, 'reject')
                      }
                      className="staff-reject-button"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}