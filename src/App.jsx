import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import ChooseRole from "./pages/ChooseRole";
import AdminSeed from "./pages/AdminSeed";
import Dashboard from "./pages/Dashboard";

// Student Area
import StudentLayout from "./pages/StudentLayout";
import StudentDashboard from "./pages/StudentDashboard";
import Materials from "./pages/Materials";
import StudentPractice from "./pages/StudentPractice";

// Security
import ProtectedRoute from "./pages/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* === HOME (ROOT) === 
            Ora punta alla Dashboard Tutor protetta.
            - Se Tutor: vede la Dashboard.
            - Se Studente: ProtectedRoute lo reindirizza a /student.
            - Se Guest: ProtectedRoute lo manda a /login.
        */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRole="tutor">
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* === AUTH & ONBOARDING === */}
        <Route path="/login" element={<Login />} />
        <Route path="/choose-role" element={<ChooseRole />} />
        
        {/* === TOOLS === */}
        <Route path="/admin-seed" element={<AdminSeed />} />

        {/* Legacy redirect per vecchi link /tutor */}
        <Route path="/tutor" element={<Navigate to="/" replace />} />

        {/* === AREA STUDENTE === 
            Tutte le pagine studente sono avvolte dal Layout (Navbar, ecc.)
        */}
        <Route 
          path="/student" 
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          {/* Default: reindirizza alla dashboard interna */}
          <Route index element={<Navigate to="dashboard" replace />} />
          
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="practice" element={<StudentPractice />} />
        </Route>

        {/* === FALLBACK 404 === */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}