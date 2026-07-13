import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rotas protegidas com sidebar */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"                   element={<DashboardPage />} />
            <Route path="learning-paths"              element={<LearningPathsPage />} />
            <Route path="learning-paths/:id"          element={<LearningPathDetailPage />} />
            <Route path="diagnostic/:pathId"          element={<DiagnosticTestPage />} />
            <Route path="diagnostic/:testId/result"   element={<DiagnosticResultPage />} />
            <Route path="study-plan"                  element={<StudyPlanPage />} />
            <Route path="tutor"                       element={<AITutorPage />} />
            <Route path="progress"                    element={<ProgressPage />} />

            {/* Rota exclusiva de admin */}
            <Route
              path="admin/paths"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPathsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
