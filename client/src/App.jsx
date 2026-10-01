// ─── App.jsx ──────────────────────────────────────────────────────────────────
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { DetectionProvider } from './context/DetectionContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import LiveDetection from './pages/LiveDetection'
import ZoneOverview from './pages/ZoneOverview'
import EntryLogs from './pages/EntryLogs'
import ExitLogs from './pages/ExitLogs'
import Members from './pages/management/Members'
import Guests from './pages/management/Guests'
import Delivery from './pages/management/Delivery'
import Other from './pages/management/Other'
import Settings from './pages/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <DetectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"        element={<Dashboard />} />
              <Route path="live"             element={<LiveDetection />} />
              <Route path="zones"            element={<ZoneOverview />} />
              <Route path="logs/entry"       element={<EntryLogs />} />
              <Route path="logs/exit"        element={<ExitLogs />} />
              <Route path="management/members"  element={<Members />} />
              <Route path="management/guests"   element={<Guests />} />
              <Route path="management/delivery" element={<Delivery />} />
              <Route path="management/other"    element={<Other />} />
              <Route path="settings"         element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DetectionProvider>
    </ThemeProvider>
  )
}
