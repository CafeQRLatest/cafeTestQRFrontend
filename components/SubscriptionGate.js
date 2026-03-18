import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const SubscriptionGate = ({ children }) => {
  const { isAuthenticated, isActive, loading, subscriptionStatus, subscriptionExpiryDate, normalizedExpiryDate } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to allow AuthContext state to stabilize
    if (!loading) {
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (isReady && isAuthenticated && !isActive) {
      if (router.pathname !== '/subscription' && router.pathname !== '/login') {
        console.log('SubscriptionGate: Redirecting to /subscription because isActive is false');
        router.push('/subscription');
      }
    }
  }, [isAuthenticated, isActive, isReady, router]);

  if (loading || (!isReady && isAuthenticated)) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="spinner"></div>
        <style jsx>{`
          .spinner {
            width: 40px; height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #f97316;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
};

export default SubscriptionGate;
