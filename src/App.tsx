import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PartyPopper as Party } from 'lucide-react';
import AdminPanel from './pages/AdminPanel';
import InvitePage from './pages/InvitePage';
import RespondPage from './pages/RespondPage';
import MusicPage from './pages/MusicPage';
import CostumePage from './pages/CostumePage';
import PhotoGallery from './pages/PhotoGallery';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CreateEventModal from './components/CreateEventModal';
import { CreateEventProvider, useCreateEvent } from './contexts/CreateEventContext';
import LandingPage from './pages/LandingPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (user === undefined || user === null) {
    return <LandingPage />;
    return <div>Loading...</div>; // Prevents incorrect redirection
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { showCreateEvent, setShowCreateEvent } = useCreateEvent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Party className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">alaafYOU</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <button
                  onClick={() => signOut()}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {showCreateEvent && <CreateEventModal onClose={() => setShowCreateEvent(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CreateEventProvider>
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
              <Route path="/respond/:inviteCode" element={<RespondPage />} />
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
              <Route
                path="/photos/:eventId"
                element={
                  <ProtectedRoute>
                    <PhotoGallery />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
          <Toaster position="top-right" />
        </BrowserRouter>
      </CreateEventProvider>
    </AuthProvider>
  );
}

export default App;
