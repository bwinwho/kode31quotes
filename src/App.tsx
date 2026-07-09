import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import CustomerInfo from '@/pages/CustomerInfo';
import UniverseServices from '@/pages/universe/UniverseServices';
import MultiverseHome from '@/pages/multiverse/MultiverseHome';
import AppsBusinessPicker from '@/pages/multiverse/AppsBusinessPicker';
import AppsModules from '@/pages/multiverse/AppsModules';
import CategoryServices from '@/pages/multiverse/CategoryServices';
import QuoteReview from '@/pages/QuoteReview';
import QuotesDashboard from '@/pages/dashboard/QuotesDashboard';
import QuoteDetail from '@/pages/dashboard/QuoteDetail';
import SignedCustomers from '@/pages/dashboard/SignedCustomers';
import AdminSettings from '@/pages/admin/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/customer" element={<ProtectedRoute><CustomerInfo /></ProtectedRoute>} />
          <Route path="/universe" element={<ProtectedRoute><UniverseServices /></ProtectedRoute>} />
          <Route path="/multiverse" element={<ProtectedRoute><MultiverseHome /></ProtectedRoute>} />
          <Route path="/multiverse/apps" element={<ProtectedRoute><AppsBusinessPicker /></ProtectedRoute>} />
          <Route path="/multiverse/apps/:businessTypeId" element={<ProtectedRoute><AppsModules /></ProtectedRoute>} />
          <Route path="/multiverse/:categorySlug" element={<ProtectedRoute><CategoryServices /></ProtectedRoute>} />
          <Route path="/quote" element={<ProtectedRoute><QuoteReview /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><QuotesDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
          <Route path="/signed-customers" element={<ProtectedRoute><SignedCustomers /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
