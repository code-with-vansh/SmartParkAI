// ─── Sidebar ──────────────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Camera, MapPin, LogIn, LogOut,
  Users, UserCheck, Truck, Wrench, Settings, ChevronDown, ChevronRight, Car
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Live Detection', icon: Camera,          to: '/live' },
  { label: 'Zone Overview',  icon: MapPin,          to: '/zones' },
  { label: 'Entry Logs',     icon: LogIn,           to: '/logs/entry' },
  { label: 'Exit Logs',      icon: LogOut,          to: '/logs/exit' },
  {
    label: 'Management', icon: Users, children: [
      { label: 'Members',  icon: UserCheck, to: '/management/members' },
      { label: 'Guests',   icon: Users,     to: '/management/guests' },
      { label: 'Delivery', icon: Truck,     to: '/management/delivery' },
      { label: 'Other',    icon: Wrench,    to: '/management/other' },
    ]
  },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const [mgmtOpen, setMgmtOpen] = useState(
    location.pathname.startsWith('/management')
  )

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
    }`

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
          <Car className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Smart Park</p>
          <p className="text-xs text-gray-400 leading-none mt-0.5">AI Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          if (item.children) {
            // Management group with collapsible children
            return (
              <div key={item.label}>
                <button
                  onClick={() => setMgmtOpen(o => !o)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {mgmtOpen
                    ? <ChevronDown className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {mgmtOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 dark:border-gray-800 pl-3">
                    {item.children.map(child => (
                      <NavLink key={child.to} to={child.to} className={linkClass}>
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-400">Smart Park AI v1.0</p>
      </div>
    </aside>
  )
}
