import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaEye, FaEyeSlash, FaShieldAlt, FaArrowLeft, FaKey } from 'react-icons/fa'
import api from '../utils/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpFields, setOtpFields] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState('error')
  const [showPassword, setShowPassword] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newFields = [...otpFields];
    newFields[index] = value.substring(value.length - 1);
    setOtpFields(newFields);
    if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpFields[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  const handleSendResetCode = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const response = await api.post('/api/v1/auth/forgot-password', { email });
      setOtpSent(true)
      setResendTimer(60)
      setMsgType('success')
      setMessage('A reset code has been sent to your email.')
    } catch (err) {
      setMsgType('error')
      setMessage(err.response?.data?.message || err.message || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMsgType('error')
      setMessage('Passwords do not match')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const response = await api.post('/api/v1/auth/reset-password', { 
           email, 
           otp: otpFields.join(''),
           newPassword 
      });
      setMsgType('success')
      setMessage('Password reset successful! Redirecting...')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setMsgType('error')
      setMessage(err.response?.data?.message || err.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="auth-card">
        {/* Visual Panel */}
        <div className="visual-panel">
          <div className="circle-overlay" />
          <div className="visual-content">
             <button className="back-btn" onClick={() => otpSent ? setOtpSent(false) : router.push('/login')}>
                <FaArrowLeft />
             </button>
             <div className="brand">CafeQR</div>
             <h1>{otpSent ? 'Reset\nAccess' : 'Forgot\nPassword?'}</h1>
             <p>{otpSent ? 'Enter the security code and your new password.' : 'No worries! Enter your email and we\'ll send you a recovery code.'}</p>
          </div>
        </div>

        {/* Form Panel */}
        <div className="form-panel">
          <div className="form-container">
            <form onSubmit={otpSent ? handleResetPassword : handleSendResetCode}>
              {!otpSent ? (
                <div className="field-group">
                  <label>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    placeholder="name@company.com"
                    disabled={loading}
                  />
                </div>
              ) : (
                <div className="reset-stack">
                  <div className="otp-view">
                    <label>VERIFICATION CODE</label>
                    <div className="otp-grid">
                      {otpFields.map((digit, i) => (
                        <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} />
                      ))}
                    </div>
                  </div>

                  <div className="field-group">
                    <label>NEW PASSWORD</label>
                    <div className="pw-wrap">
                        <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="••••••••" disabled={loading} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                  </div>

                  <div className="field-group">
                    <label>CONFIRM NEW PASSWORD</label>
                    <div className="pw-wrap">
                        <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="••••••••" disabled={loading} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                  </div>
                </div>
              )}

              {message && <div className={`status-msg ${msgType}`}>{message}</div>}

              <button type="submit" disabled={loading} className="primary-btn">
                {loading ? 'Processing...' : (otpSent ? 'Update Password' : 'Send Reset Code')}
              </button>
              
              <div className="bottom-links">
                Back to <Link href="/login">Sign In</Link>
              </div>

              <div className="footer-copyright">
                &copy; 2026 CAFEQR. ALL RIGHTS RESERVED
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { background: #f1f5f9; margin: 0; font-family: 'Inter', sans-serif; color: #1e293b; }
      `}</style>

      <style jsx>{`
        .page-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .auth-card { 
            width: 100%; max-width: 1000px; display: flex; background: white; 
            border-radius: 32px; overflow: hidden; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.12);
            min-height: 600px;
        }

        .visual-panel { 
            width: 42%; background: #f97316; 
            position: relative; overflow: hidden; color: white;
            display: flex; flex-direction: column; justify-content: center; padding: 60px;
        }
        .circle-overlay { 
            position: absolute; top: -100px; right: -100px; 
            width: 320px; height: 320px; background: #115e59;
            border-radius: 50%;
        }
        .visual-content { position: relative; z-index: 2; }
        .back-btn { background: none; border: none; color: white; cursor: pointer; font-size: 20px; margin-bottom: 30px; padding: 0; }
        .brand { font-size: 22px; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px; }
        .visual-panel h1 { font-size: 48px; font-weight: 800; line-height: 1.1; margin: 0 0 20px; white-space: pre-line; }
        .visual-panel p { font-size: 16px; line-height: 1.6; opacity: 0.9; }

        .form-panel { flex: 1; padding: 60px; display: flex; align-items: center; justify-content: center; }
        .form-container { width: 100%; max-width: 400px; }
        
        .reset-stack { display: flex; flex-direction: column; gap: 24px; }
        .field-group { display: flex; flex-direction: column; gap: 8px; }
        .field-group label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; }
        .field-group input { 
            width: 100%; padding: 12px 14px; font-size: 15px; font-weight: 500; 
            border: 1px solid #e2e8f0; border-radius: 10px; background: #fff;
            color: #1e293b; outline: none; transition: 0.2s;
        }
        .field-group input:focus { border-color: #115e59; background: #f0fdfa; }

        .pw-wrap { position: relative; }
        .pw-wrap button { position: absolute; right: 12px; top: 12px; background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; }

        .otp-view { text-align: center; }
        .otp-view label { display: block; margin-bottom: 12px; }
        .otp-grid { display: flex; gap: 10px; justify-content: center; }
        .otp-grid input { 
            width: 44px; height: 56px; text-align: center; font-size: 24px; font-weight: 800; color: #115e59;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; outline: none; transition: 0.2s;
        }
        .otp-grid input:focus { border-color: #f97316; background: white; transform: translateY(-2px); }

        .status-msg { padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-top: 24px; text-align: center; }
        .status-msg.error { background: #fef2f2; color: #ef4444; }
        .status-msg.success { background: #f0fdf4; color: #16a34a; }

        .primary-btn { 
            width: 100%; padding: 16px; background: #115e59; color: white; border: none; border-radius: 12px;
            font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 32px; transition: 0.2s;
            box-shadow: 0 10px 20px -5px rgba(17, 94, 89, 0.3);
        }
        .primary-btn:hover { background: #0d4a46; transform: translateY(-2px); }
        .primary-btn:disabled { opacity: 0.6; cursor: wait; }

        .bottom-links { text-align: center; margin-top: 32px; font-size: 14px; font-weight: 600; color: #64748b; }
        .bottom-links :global(a) { color: #f97316; text-decoration: none; font-weight: 800; margin-left: 4px; }
        
        .footer-copyright { text-align: center; margin-top: 40px; font-size: 11px; color: #cbd5e1; font-weight: 700; letter-spacing: 1px; }

        @media (max-width: 1024px) {
            .auth-card { flex-direction: column; max-width: 480px; height: auto; border-radius: 0; }
            .visual-panel { width: 100%; min-height: 240px; padding: 40px; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; }
            .visual-panel h1 { font-size: 32px; }
            .form-panel { padding: 40px 30px; }
            .page-wrapper { padding: 0; align-items: flex-start; background: white; }
        }
      `}</style>
    </div>
  )
}
