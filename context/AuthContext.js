import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [email, setEmail] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState(null);
  const [clientName, setClientName] = useState(null);
  const [terminalId, setTerminalId] = useState(null);
  const [terminalName, setTerminalName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currency, setCurrency] = useState(null);
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for session metadata in cookies 
    // access_token and refresh_token are HttpOnly, so we can't see them directly
    const storedRole = Cookies.get('userRole');
    const storedEmail = Cookies.get('userEmail');
    const storedFirstName = Cookies.get('firstName');
    const storedLastName = Cookies.get('lastName');
    const storedStatus = (Cookies.get('subscriptionStatus') || '').toUpperCase();
    const storedExpiry = Cookies.get('subscriptionExpiryDate');
    const storedOrgId = Cookies.get('orgId');
    const storedOrgName = Cookies.get('orgName');
    const storedClientName = Cookies.get('clientName');
    const storedTerminalId = Cookies.get('terminalId');
    const storedTerminalName = Cookies.get('terminalName');
    const storedUserId = Cookies.get('userId');
    const storedCurrency = Cookies.get('currency');
    const storedCountry = Cookies.get('country');
    
    if (storedEmail) setEmail(storedEmail);
    if (storedFirstName) setFirstName(storedFirstName);
    if (storedLastName) setLastName(storedLastName);
    if (storedRole) setUserRole(storedRole);
    if (storedStatus) setSubscriptionStatus(storedStatus);
    if (storedOrgId) setOrgId(storedOrgId);
    if (storedOrgName) setOrgName(storedOrgName);
    if (storedClientName) setClientName(storedClientName);
    if (storedTerminalId) setTerminalId(storedTerminalId);
    if (storedTerminalName) setTerminalName(storedTerminalName);
    if (storedUserId) setUserId(storedUserId);
    if (storedCurrency) setCurrency(storedCurrency);
    if (storedCountry) setCountry(storedCountry);
    
    if (storedExpiry) {
      try {
        const parsed = JSON.parse(storedExpiry);
        setSubscriptionExpiryDate(parsed);
      } catch (e) {
        setSubscriptionExpiryDate(storedExpiry);
      }
    }
    
    setLoading(false);
  }, []);

  const login = (data) => {
    const role = data.role;
    const userEmail = data.email;
    const status = (data.subscriptionStatus || data.subscription_status || '').toUpperCase();
    let expiry = data.subscriptionExpiryDate || data.subscription_expiry_date;
    
    if (Array.isArray(expiry)) {
      expiry = new Date(expiry[0], expiry[1]-1, expiry[2], expiry[3]||0, expiry[4]||0).toISOString();
    }
    
    setUserRole(role);
    setEmail(userEmail);
    setFirstName(data.firstName || null);
    setLastName(data.lastName || null);
    setSubscriptionStatus(status);
    setSubscriptionExpiryDate(expiry);
    setOrgId(data.orgId || null);
    setOrgName(data.orgName || null);
    setClientName(data.clientName || null);
    setTerminalId(data.terminalId || null);
    setTerminalName(data.terminalName || null);
    setUserId(data.userId || null);
    setCurrency(data.currency || null);
    setCountry(data.country || null);
    
    // Metadata cookies (Non-HttpOnly) for frontend logic
    const cookieOptions = { expires: 7, secure: true, sameSite: 'strict', path: '/' };
    if (role) Cookies.set('userRole', role, cookieOptions);
    if (userEmail) Cookies.set('userEmail', userEmail, cookieOptions);
    if (data.firstName) Cookies.set('firstName', data.firstName, cookieOptions);
    if (data.lastName) Cookies.set('lastName', data.lastName, cookieOptions);
    if (status) Cookies.set('subscriptionStatus', status, cookieOptions);
    if (expiry) {
      const expiryStr = typeof expiry === 'string' ? expiry : JSON.stringify(expiry);
      Cookies.set('subscriptionExpiryDate', expiryStr, cookieOptions);
    }
    if (data.orgId) Cookies.set('orgId', data.orgId, cookieOptions);
    if (data.orgName) Cookies.set('orgName', data.orgName, cookieOptions);
    if (data.clientName) Cookies.set('clientName', data.clientName, cookieOptions);
    if (data.terminalId) Cookies.set('terminalId', data.terminalId, cookieOptions);
    if (data.terminalName) Cookies.set('terminalName', data.terminalName, cookieOptions);
    if (data.userId) Cookies.set('userId', data.userId, cookieOptions);
    if (data.currency) Cookies.set('currency', data.currency, cookieOptions);
    if (data.country) Cookies.set('country', data.country, cookieOptions);
  };

  const logout = async () => {
    // Clear local state immediately for better UX
    setUserRole(null);
    setEmail(null);
    setFirstName(null);
    setLastName(null);
    setSubscriptionStatus(null);
    setSubscriptionExpiryDate(null);
    setOrgId(null);
    setOrgName(null);
    setClientName(null);
    setTerminalId(null);
    setTerminalName(null);
    setUserId(null);
    setCurrency(null);
    setCountry(null);
    
    // Clear cookies with explicit path
    const removeOptions = { path: '/' };
    Cookies.remove('userRole', removeOptions);
    Cookies.remove('userEmail', removeOptions);
    Cookies.remove('firstName', removeOptions);
    Cookies.remove('lastName', removeOptions);
    Cookies.remove('subscriptionStatus', removeOptions);
    Cookies.remove('subscriptionExpiryDate', removeOptions);
    Cookies.remove('orgId', removeOptions);
    Cookies.remove('orgName', removeOptions);
    Cookies.remove('clientName', removeOptions);
    Cookies.remove('terminalId', removeOptions);
    Cookies.remove('terminalName', removeOptions);
    Cookies.remove('userId', removeOptions);
    Cookies.remove('currency', removeOptions);
    Cookies.remove('country', removeOptions);
    
    try {
      // Attempt to notify backend, but don't block the UI
      await api.post('/api/v1/auth/logout');
    } catch (err) {
      console.error("Logout backend notification failed:", err);
    } finally {
      // Always redirect to login
      router.push('/login');
    }
  };

  const getNormalizedDate = (val) => {
    if (!val) return null;
    try {
      if (Array.isArray(val)) {
        return new Date(val[0], val[1]-1, val[2], val[3]||0, val[4]||0);
      }
      let dateStr = String(val);
      if (dateStr.includes(' ') && !dateStr.includes('T')) {
        dateStr = dateStr.replace(' ', 'T');
      }
      // Truncate micro
      const dotIndex = dateStr.indexOf('.');
      if (dotIndex !== -1) {
        const fraction = dateStr.substring(dotIndex + 1);
        if (fraction.length > 3) {
          dateStr = dateStr.substring(0, dotIndex + 4); 
        }
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  };

  const normalizedExpiryDate = getNormalizedDate(subscriptionExpiryDate);

  const isAuthenticated = !!email;

  const isActive = (() => {
    if (!isAuthenticated) return false;
    const status = (subscriptionStatus || '').toUpperCase();
    const isTrialOrActive = status === 'TRIAL' || status === 'ACTIVE';
    const isExpired = normalizedExpiryDate && normalizedExpiryDate < new Date();
    
    return isTrialOrActive && !isExpired;
  })();

  return (
    <AuthContext.Provider value={{ 
      userRole,
      email,
      subscriptionStatus, 
      subscriptionExpiryDate, 
      normalizedExpiryDate,
      login, 
      logout, 
      isAuthenticated, 
      isActive,
      orgId,
      orgName,
      clientName,
      terminalId,
      terminalName,
      userId,
      firstName,
      lastName,
      fullName: firstName ? `${firstName} ${lastName || ''}`.trim() : null,
      currency,
      country,
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
