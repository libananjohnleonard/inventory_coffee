import { NavLink, Outlet } from 'react-router-dom'

function LogoMark() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-700 text-white font-bold text-lg">
      ☕
    </span>
  )
}

function navLinkClass({ isActive }) {
  return isActive
    ? 'flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-700/20 text-amber-700 font-medium border-l-4 border-amber-700'
    : 'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-amber-700 hover:bg-amber-50 transition'
}

export function AppShell({ contextValue, onOpenProductModal, onOpenStockLogModal }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Logo and System Name */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
          <LogoMark />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-amber-900">Coffee</h1>
            <p className="text-xs text-gray-600">Inventory System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavLink to="/dashboard" className={navLinkClass}>
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4"
                />
              </svg>
              <span>Dashboard</span>
            </>
          </NavLink>

          <NavLink to="/inventory" className={navLinkClass}>
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m0 0l8-4m0 0l8 4M4 7v10a1 1 0 001 1h14a1 1 0 001-1V7"
                />
              </svg>
              <span>Inventory</span>
            </>
          </NavLink>

          <NavLink to="/reports" className={navLinkClass}>
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Reports</span>
            </>
          </NavLink>

          <NavLink to="/profile" className={navLinkClass}>
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Profile</span>
            </>
          </NavLink>
        </nav>

        {/* Action Buttons */}
        <div className="px-4 py-4 space-y-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onOpenProductModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
          <button
            type="button"
            onClick={() => onOpenStockLogModal()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Update Stock
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet context={contextValue} />
        </div>
      </main>
    </div>
  )
}
