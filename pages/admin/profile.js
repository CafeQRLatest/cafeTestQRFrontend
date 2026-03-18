import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../utils/api';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaShieldAlt, 
  FaKey, 
  FaFingerprint, 
  FaPaperPlane, 
  FaLock, 
  FaCheckCircle,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Password Change State
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const fetchProfile = async () => {
    try {
      const resp = await api.get('/api/v1/users/me');
      if (resp.data.success) {
        setUser(resp.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!user?.email) {
      setMsg({ text: 'Error: Email not found in profile. Please refresh or contact support.', type: 'error' });
      return;
    }
    setSendingOtp(true);
    setMsg({ text: '', type: '' });
    try {
      const resp = await api.post('/api/v1/auth/forgot-password', { email: user.email });
      if (resp.data.success) {
        setOtpSent(true);
        setResendTimer(60);
        setMsg({ text: 'Verification code sent to your email!', type: 'success' });
      } else {
        setMsg({ text: resp.data.message || 'Failed to send verification code', type: 'error' });
      }
    } catch (err) {
      console.error("OTP Error:", err);
      setMsg({ text: err.response?.data?.message || 'Failed to send verification code. Please try again.', type: 'error' });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
        setMsg({ text: 'Password must be at least 6 characters', type: 'error' });
        return;
    }

    setUpdatingPassword(true);
    setMsg({ text: '', type: '' });
    try {
      const resp = await api.post('/api/v1/auth/reset-password', { 
        email: user.email, 
        otp, 
        newPassword 
      });
      if (resp.data.success) {
        setMsg({ text: 'Password updated successfully!', type: 'success' });
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpSent(false);
        setResendTimer(0);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update password', type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="shimmer-card"></div>
      <style jsx>{`
        .loading-container { padding: 40px; display: flex; justify-content: center; }
        .shimmer-card { width: 100%; max-width: 800px; height: 400px; background: #f1f5f9; border-radius: 24px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );

  return (
    <DashboardLayout 
      title="Account Settings" 
      subtitle="Manage your profile & security"
      showBack={true}
    >
      <div className="profile-grid">
        {/* Profile Card */}
        <div className="profile-card info-card">
          <div className="card-header">
            <div className="header-icon"><FaUser /></div>
            <h2>Personal Information</h2>
          </div>
          <div className="info-body">
            <div className="info-row">
              <label><FaFingerprint /> Full Name</label>
              <p>{user?.firstName} {user?.lastName}</p>
            </div>
            <div className="info-row">
              <label><FaEnvelope /> Email Address</label>
              <p>{user?.email}</p>
            </div>
            <div className="info-row">
              <label><FaPhone /> Phone Number</label>
              <p>{user?.phone || 'Not provided'}</p>
            </div>
            <div className="info-row">
              <label><FaShieldAlt /> Assigned Role</label>
              <p className="role-text">{user?.role?.replace('ROLE_', '').replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="profile-card security-card">
          <div className="card-header">
            <div className="header-icon"><FaLock /></div>
            <h2>Security & Password</h2>
          </div>
          <div className="security-body">
            {!otpSent ? (
               <div className="otp-intro">
                 <p>To change your password, we need to verify your identity. We will send a secure 6-digit code to your registered email.</p>
                 <button 
                   onClick={handleSendOtp} 
                   disabled={sendingOtp}
                   className="action-btn otp-btn"
                 >
                   {sendingOtp ? 'Sending...' : <><FaPaperPlane /> Send Verification Code</>}
                 </button>
               </div>
            ) : (
               <form onSubmit={handleUpdatePassword} className="password-form">
                 <div className="resend-container">
                   {resendTimer > 0 ? (
                     <span className="resend-text">Resend code in <strong>{resendTimer}s</strong></span>
                   ) : (
                     <button 
                       type="button" 
                       onClick={handleSendOtp} 
                       disabled={sendingOtp}
                       className="resend-link-btn"
                     >
                       {sendingOtp ? 'Sending...' : 'Didn\'t receive code? Resend'}
                     </button>
                   )}
                 </div>
                 <div className="input-field">
                   <label>Verification Code (OTP)</label>
                   <div className="otp-input-group">
                     {[0, 1, 2, 3, 4, 5].map((index) => (
                       <input
                         key={index}
                         id={`otp-${index}`}
                         type="text"
                         className="otp-char-input"
                         maxLength={1}
                         value={otp[index] || ''}
                         onChange={(e) => {
                           const val = e.target.value;
                           if (val && !/^\d+$/.test(val)) return;
                           const newOtp = otp.split('');
                           newOtp[index] = val;
                           const combined = newOtp.join('');
                           setOtp(combined);
                           
                           if (val && index < 5) {
                             document.getElementById(`otp-${index + 1}`).focus();
                           }
                         }}
                         onKeyDown={(e) => {
                           if (e.key === 'Backspace' && !otp[index] && index > 0) {
                             document.getElementById(`otp-${index - 1}`).focus();
                           }
                         }}
                       />
                     ))}
                   </div>
                 </div>
                 <div className="input-field">
                   <label>New Password</label>
                   <div className="password-input-wrapper">
                     <input 
                       type={showPassword ? "text" : "password"} 
                       placeholder="Min 6 characters" 
                       value={newPassword}
                       onChange={(e) => setNewPassword(e.target.value)}
                       required
                     />
                     <button 
                       type="button" 
                       className="toggle-password"
                       onClick={() => setShowPassword(!showPassword)}
                     >
                       {showPassword ? <FaEyeSlash /> : <FaEye />}
                     </button>
                   </div>
                 </div>
                 <div className="input-field">
                   <label>Confirm Password</label>
                   <div className="password-input-wrapper">
                     <input 
                       type={showPassword ? "text" : "password"} 
                       placeholder="Confirm new password" 
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                       required
                     />
                     <button 
                       type="button" 
                       className="toggle-password"
                       onClick={() => setShowPassword(!showPassword)}
                     >
                       {showPassword ? <FaEyeSlash /> : <FaEye />}
                     </button>
                   </div>
                 </div>
                 <div className="form-actions">
                   <button 
                     type="submit" 
                     disabled={updatingPassword}
                     className="action-btn update-btn"
                   >
                     {updatingPassword ? 'Updating...' : <><FaCheckCircle /> Update Password</>}
                   </button>
                   <button 
                     type="button" 
                     onClick={() => {
                       setOtpSent(false);
                       setMsg({ text: '', type: '' });
                       setOtp('');
                     }} 
                     className="cancel-btn"
                   >
                     Cancel
                   </button>
                 </div>
               </form>
            )}

            {msg.text && (
              <div className={`status-msg ${msg.type}`}>
                {msg.text}
              </div>
            )}
          </div>
        </div>
      </div>
      

      <style jsx>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 20px;
        }

        .profile-card {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .profile-card:hover {
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: #cbd5e1;
        }

        .card-header {
          padding: 32px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: #fff; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; color: #f97316;
        }
        .card-header h2 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }

        .info-body, .security-body { padding: 32px; }

        .info-row { margin-bottom: 24px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-row label {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 800; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;
        }
        .info-row p { margin: 0; font-size: 16px; font-weight: 700; color: #334155; }
        .role-text { color: #f97316 !important; }

        .otp-intro p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }

        .input-field { margin-bottom: 20px; }
        .input-field label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .input-field input {
          width: 100%; padding: 12px 16px; border-radius: 12px;
          border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: all 0.2s;
          color: #000; font-weight: 500;
        }
        .input-field input:focus { border-color: #f97316; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
        
        .otp-input-group {
          display: flex;
          gap: 10px;
          justify-content: center;
          background: #f8fafc;
          padding: 20px;
          border-radius: 20px;
          border: 1px dashed #cbd5e1;
          margin-bottom: 10px;
        }
        .otp-char-input {
          width: 42px !important;
          height: 52px;
          text-align: center;
          font-size: 22px !important;
          font-weight: 800;
          padding: 0 !important;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: white;
          color: #0f172a;
          transition: all 0.2s;
        }
        .otp-char-input:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
          transform: translateY(-2px);
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-input-wrapper input {
          padding-right: 48px;
        }
        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          transition: color 0.2s;
        }
        .toggle-password:hover {
          color: #f97316;
        }

        .action-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .otp-btn { background: #f97316; color: white; }
        .otp-btn:hover { background: #ea580c; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2); }
        .update-btn { background: #f97316; color: white; }
        .update-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2); }

        .cancel-btn {
          width: 100%; background: transparent; border: 1px solid #e2e8f0;
          color: #64748b; padding: 12px; border-radius: 12px; margin-top: 12px;
          font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s;
        }
        .cancel-btn:hover { background: #f8fafc; color: #0f172a; }

        .resend-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .resend-text { color: #94a3b8; }
        .resend-text strong { color: #f97316; }
        .resend-link-btn {
          background: none;
          border: none;
          color: #f97316;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
        .resend-link-btn:hover { color: #ea580c; }
        .resend-link-btn:disabled { color: #cbd5e1; cursor: not-allowed; text-decoration: none; }

        .status-msg { margin-top: 20px; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 600; text-align: center; }
        .status-msg.success { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        .status-msg.error { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }

        @media (max-width: 900px) {
          .profile-grid { grid-template-columns: 1fr; gap: 24px; }
          .card-header, .info-body, .security-body { padding: 24px; }
          .otp-input-group { gap: 8px; padding: 12px; }
          .otp-char-input { width: 38px !important; height: 48px; font-size: 18px !important; }
        }

        @media (max-width: 480px) {
           .otp-char-input { width: 34px !important; height: 44px; font-size: 16px !important; }
           .card-header h2 { font-size: 16px; }
           .action-btn { padding: 12px; font-size: 13px; }
        }
      `}</style>
    </DashboardLayout>
  );
}
