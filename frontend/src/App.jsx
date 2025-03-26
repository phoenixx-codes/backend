import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import HomePage from './components/home/HomePage';
import UserLogin from './components/user/UserLogin';
import AdminLogin from './components/admin/AdminLogin';
import UserDashboard from './components/user/UserDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppBar from './components/layout/AppBar';
import { Box } from '@mui/material';
import CandidatesList from "./CandidatesList"; // ✅ Import the component

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary'
        }}>
          <AppBar />
          <Box component="main" sx={{ flexGrow: 1, pb: 6 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
              <Route path="/user/login" element={<UserLogin />} />
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <CandidatesList /> {/* ✅ Add the component inside */}
          </Box>
        </Box>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
