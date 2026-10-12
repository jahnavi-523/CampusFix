// Shared dashboard shell.
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './MainLayout.css'

export default function MainLayout({ children }) {
  return (
    <div className="campus-layout">
      <Sidebar />

      <div className="campus-layout-main">
        <Topbar />

        <main className="campus-layout-content">
          {children}
        </main>
      </div>
    </div>
  )
}