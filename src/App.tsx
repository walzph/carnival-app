import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PartyPopper as Party } from 'lucide-react';
import AdminPanel from './pages/AdminPanel';
import InvitePage from './pages/InvitePage';
import RespondPage from './pages/RespondPage';
import MusicPage from './pages/MusicPage';
import CostumePage from './pages/CostumePage';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Party className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">Carnival Planner</span>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => signOut()}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invite/:eventId"
              element={
                <ProtectedRoute>
                  <InvitePage />
                </ProtectedRoute>
              }
            />
            <Route path="/respond/:inviteId" element={<RespondPage />} />
            <Route
              path="/music/:eventId"
              element={
                <ProtectedRoute>
                  <MusicPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/costumes/:eventId"
              element={
                <ProtectedRoute>
                  <CostumePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;