import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute   from './components/common/ProtectedRoute'
import Layout           from './components/common/Layout'

import LoginPage              from './pages/LoginPage'
import RegisterPage           from './pages/RegisterPage'
import DashboardPage          from './pages/DashboardPage'
import LearningPathsPage      from './pages/LearningPathsPage'
import LearningPathDetailPage from './pages/LearningPathDetailPage'
import DiagnosticTestPage     from './pages/DiagnosticTestPage'
import DiagnosticResultPage   from './pages/DiagnosticResultPage'
import StudyPlanPage          from './pages/StudyPlanPage'
import AITutorPage            from './pages/AITutorPage'
import ProgressPage           from './pages/ProgressPage'
import AdminPathsPage         from './pages/AdminPathsPage'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"                 element={<DashboardPage />} />
            <Route path="learning-paths"            element={<LearningPathsPage />} />
            <Route path="learning-paths/:id"        element={<LearningPathDetailPage />} />
            <Route path="diagnostic/:pathId"        element={<DiagnosticTestPage />} />
            <Route path="progress-test/:pathId"     element={<DiagnosticTestPage mode="progress" />} />
            <Route path="diagnostic/:testId/result" element={<DiagnosticResultPage />} />
            <Route path="study-plan"                element={<StudyPlanPage />} />
            <Route path="tutor"                     element={<AITutorPage />} />
            <Route path="progress"                  element={<ProgressPage />} />
            <Route
              path="admin/paths"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPathsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
