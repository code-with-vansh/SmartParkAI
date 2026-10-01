// ─── Layout ───────────────────────────────────────────────────────────────────
import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import UnknownVehicleModal from '../modals/UnknownVehicleModal'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      {/* Global unknown vehicle popup — rendered at root level */}
      <UnknownVehicleModal />
    </div>
  )
}
