// Student notifications page.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  FileText,
  UserRound,
  Wrench,
  CheckCircle2,
  Clock3,
  ArrowRight,
  Inbox,
  Trash2,
  Info,
} from 'lucide-react'

import MainLayout from '../../components/layout/MainLayout'
import './NotificationsPage.css'

const STORAGE_KEY = 'campusfixNotifications'

const initialNotifications = [
  {
    id: 'welcome-notification',
    type: 'info',
    title: 'Welcome to CampusFix!',
    message:
      'Welcome to your student portal. Report campus issues and track their progress from one place.',
    date: new Date().toISOString(),
    read: false,
    complaintId: null,
  },
]

function readNotifications() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)

    if (!saved) return initialNotifications

    const parsed = JSON.parse(saved)

    return Array.isArray(parsed) ? parsed : initialNotifications
  } catch {
    return initialNotifications
  }
}

function saveNotifications(notifications) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

function formatNotificationDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const difference = now.getTime() - date.getTime()

  if (difference >= 0 && difference < 60_000) {
    return 'Just now'
  }

  if (difference >= 0 && difference < 3_600_000) {
    const minutes = Math.floor(difference / 60_000)
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  }

  if (difference >= 0 && difference < 86_400_000) {
    const hours = Math.floor(difference / 3_600_000)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const notificationIcons = {
  info: Info,
  submitted: FileText,
  assigned: UserRound,
  progress: Wrench,
  resolved: CheckCircle2,
}

export default function NotificationsPage() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState(readNotifications)
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    function refreshNotifications() {
      setNotifications(readNotifications())
    }

    window.addEventListener('storage', refreshNotifications)

    return () => {
      window.removeEventListener('storage', refreshNotifications)
    }
  }, [])

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === 'Unread') return !notification.read
    if (activeFilter === 'Read') return notification.read

    return true
  })

  function updateNotifications(nextNotifications) {
    setNotifications(nextNotifications)
    saveNotifications(nextNotifications)
  }

  function markAsRead(notificationId) {
    updateNotifications(
      notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  function markAllAsRead() {
    updateNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    )
  }

  function deleteNotification(notificationId) {
    updateNotifications(
      notifications.filter(
        (notification) => notification.id !== notificationId
      )
    )
  }

  function openNotification(notification) {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.complaintId) {
      navigate(
        `/student/complaints/${encodeURIComponent(
          notification.complaintId
        )}`
      )
    }
  }

  return (
    <MainLayout>
      <div className="campus-notifications-page">
        <header className="notifications-page-heading">
          <div>
            <span className="notifications-eyebrow">
              <Bell size={15} />
              YOUR UPDATES
            </span>

            <h1>Notifications</h1>

            <p>
              Stay informed about your complaints and campus updates.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="notifications-mark-all"
              onClick={markAllAsRead}
            >
              <CheckCheck size={17} />
              Mark all as read
            </button>
          )}
        </header>

        <section className="notifications-summary">
          <div className="notifications-summary-icon">
            <Bell size={23} />
          </div>

          <div className="notifications-summary-copy">
            <strong>
              {unreadCount === 0
                ? "You're all caught up!"
                : `You have ${unreadCount} unread ${
                    unreadCount === 1 ? 'notification' : 'notifications'
                  }`}
            </strong>

            <p>
              {unreadCount === 0
                ? 'New updates will appear here when available.'
                : 'Review your latest updates so you do not miss anything important.'}
            </p>
          </div>

          <span className="notifications-summary-count">
            {unreadCount}
          </span>
        </section>

        <section className="notifications-content">
          <div className="notifications-toolbar">
            <div>
              <h2>Recent Activity</h2>

              <p>
                {filteredNotifications.length}{' '}
                {filteredNotifications.length === 1
                  ? 'notification'
                  : 'notifications'}
              </p>
            </div>

            <div className="notifications-filters">
              {['All', 'Unread', 'Read'].map((filter) => {
                const count =
                  filter === 'All'
                    ? notifications.length
                    : filter === 'Unread'
                      ? unreadCount
                      : notifications.length - unreadCount

                return (
                  <button
                    type="button"
                    key={filter}
                    className={`notifications-filter ${
                      activeFilter === filter ? 'active' : ''
                    }`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                    <span>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {filteredNotifications.length > 0 ? (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => {
                const Icon =
                  notificationIcons[notification.type] || Info

                return (
                  <article
                    key={notification.id}
                    className={`notification-item ${
                      notification.read ? 'is-read' : 'is-unread'
                    }`}
                  >
                    <div
                      className={`notification-item-icon notification-icon-${notification.type}`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="notification-item-content">
                      <div className="notification-item-heading">
                        <h3>{notification.title}</h3>

                        {!notification.read && (
                          <span className="notification-unread-dot" />
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <div className="notification-item-meta">
                        <Clock3 size={13} />

                        <span>
                          {formatNotificationDate(notification.date)}
                        </span>

                        {notification.complaintId && (
                          <span className="notification-complaint-id">
                            {notification.complaintId}
                          </span>
                        )}
                      </div>

                      {notification.complaintId && (
                        <button
                          type="button"
                          className="notification-view-button"
                          onClick={() => openNotification(notification)}
                        >
                          View Complaint
                          <ArrowRight size={15} />
                        </button>
                      )}
                    </div>

                    <div className="notification-item-actions">
                      {!notification.read && (
                        <button
                          type="button"
                          title="Mark as read"
                          aria-label="Mark notification as read"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCheck size={17} />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete notification"
                        aria-label="Delete notification"
                        onClick={() =>
                          deleteNotification(notification.id)
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="notifications-empty">
              <span className="notifications-empty-icon">
                <Inbox size={30} />
              </span>

              <h3>
                {activeFilter === 'Unread'
                  ? 'No unread notifications'
                  : activeFilter === 'Read'
                    ? 'No read notifications'
                    : 'No notifications yet'}
              </h3>

              <p>
                {activeFilter === 'All'
                  ? 'Updates about your campus complaints will appear here.'
                  : 'Try selecting another filter to view your notifications.'}
              </p>

              {activeFilter !== 'All' && (
                <button
                  type="button"
                  className="notifications-show-all"
                  onClick={() => setActiveFilter('All')}
                >
                  Show all notifications
                </button>
              )}
            </div>
          )}
        </section>

        <div className="notifications-help-note">
          <Info size={18} />

          <p>
            <strong>Stay updated.</strong> Notifications in this demo
            are stored in your current browser session. Automatic
            notifications from admin and staff will be connected when
            we implement the backend.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}