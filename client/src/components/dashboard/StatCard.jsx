// Dashboard metric card.
import './StatCard.css'
export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'green',
}) {
  return (
    <article className={`campus-stat-card campus-stat-card--${color}`}>
      <div className="campus-stat-card-top">
        <span className="campus-stat-title">{title}</span>

        <span className="campus-stat-icon">
          {Icon && <Icon size={20} strokeWidth={1.8} />}
        </span>
      </div>

      <div className="campus-stat-value">{value}</div>

      <p className="campus-stat-description">{description}</p>
    </article>
  )
}