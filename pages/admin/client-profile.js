import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import RoleGate from '../../components/RoleGate';
import NiceSelect from '../../components/NiceSelect';
import api from '../../utils/api';
import { FaSave, FaCheckCircle, FaExclamationCircle, FaUserCircle, FaGlobe, FaIdCard, FaEdit, FaTimes, FaLock, FaPalette, FaClock, FaInstagram, FaFacebook, FaUniversity, FaImage } from 'react-icons/fa';

export default function ClientProfilePage() {
  return (
    <RoleGate allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <ClientProfileContent />
    </RoleGate>
  );
}

function ClientProfileContent() {
  const { email, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States for Security & Mode
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [msgType, setMsgType] = useState('success');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    country: '',
    posType: '',
    gstNumber: '',
    fssaiNumber: '',
    website: '',
    currency: 'INR',
    logoUrl: '',
    brandColor: '#f97316',
    timezone: 'UTC+5:30 (India)',
    primaryLanguage: 'English',
    instagramUrl: '',
    facebookUrl: '',
    whatsappNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });

  useEffect(() => {
    fetchClient();
  }, []);

  const fetchClient = async () => {
    try {
      const resp = await api.get('/api/v1/clients/me');
      if (resp.data.success) {
        const data = resp.data.data;
        setFormData({
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          country: data.country || '',
          posType: data.posType || '',
          gstNumber: data.gstNumber || '',
          fssaiNumber: data.fssaiNumber || '',
          website: data.website || '',
          currency: data.currency || (data.country === 'India' ? 'INR' : 'USD'),
          logoUrl: data.logoUrl || '',
          brandColor: data.brandColor || '#f97316',
          timezone: data.timezone || 'UTC+5:30 (India)',
          primaryLanguage: data.primaryLanguage || 'English',
          instagramUrl: data.instagramUrl || '',
          facebookUrl: data.facebookUrl || '',
          whatsappNumber: data.whatsappNumber || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || ''
        });
      } else {
        setMsgType('error');
        setMessage("Could not load profile.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMsgType('error');
      setMessage("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);

        const base64 = canvas.toDataURL('image/png', 0.8);
        setFormData(prev => ({ ...prev, logoUrl: base64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      const resp = await api.put(`/api/v1/clients/${formData.id}`, formData);
      
      if (resp.data.success) {
        setMsgType('success');
        setMessage("Global business details updated!");
        setIsEditing(false);
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(resp.data.message || "Failed to update profile info");
      }
    } catch (err) {
      setMsgType('error');
      setMessage(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassMessage({ type: 'wait', text: 'Processing...' });
    
    try {
      const resp = await api.post('/api/v1/auth/change-password', { email, currentPassword, newPassword });
      if (resp.data.success) {
        setPassMessage({ type: 'success', text: 'Password updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setPassMessage(null), 4000);
      } else {
        throw new Error(resp.data.message || 'Password update failed');
      }
    } catch (err) {
      setPassMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFoodBusiness = ['Cafe', 'Restaurant', 'QSR', 'Bakery'].includes(formData.posType);

  if (loading) return <div className="loading-state">Loading business data...</div>;

  return (
    <DashboardLayout title="Client Management" showBack={true}>
      <div className="profile-wrapper">
        <div className="profile-top-bar">
          <div className="business-summary">
            <div className="biz-avatar">
              <FaIdCard />
            </div>
            <div className="biz-meta">
               <h2>{formData.name || 'Set Business Name'}</h2>
               <span>{formData.posType} • {formData.country}</span>
            </div>
          </div>
          <div className="top-actions">
             {isEditing || isChangingPassword ? (
               <button className="cancel-btn" onClick={() => { setIsEditing(false); setIsChangingPassword(false); }}>
                 <FaTimes /> Cancel
               </button>
             ) : (
               <button className="edit-btn" onClick={() => setIsEditing(true)}>
                 <FaEdit /> Edit Profile
               </button>
             )}
          </div>
        </div>

        {isEditing ? (
          <div className="edit-view-container single-column">
            <form onSubmit={handleSubmit} className="compact-form">
              <div className="form-grid">
                <div className="grid-section">
                  <div className="section-header"><FaUserCircle /> Global Identity</div>
                  <div className="field-group">
                    <label>Legal Business Name <span style={{color:'red'}}>*</span></label>
                    <input value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label>Primary Business Type</label>
                    <NiceSelect 
                      options={[{value:'Cafe',label:'Cafe'},{value:'Restaurant',label:'Restaurant'},{value:'QSR',label:'QSR'},{value:'Bar',label:'Bar'},{value:'Bakery',label:'Bakery'},{value:'Others',label:'Others'}]}
                      value={formData.posType}
                      onChange={val => handleChange('posType', val)}
                    />
                  </div>
                </div>

                <div className="grid-section">
                  <div className="section-header"><FaGlobe /> Contact & Registration</div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Country / Region <span style={{color:'red'}}>*</span></label>
                      <NiceSelect 
                        options={[{value:'India',label:'India'},{value:'UAE',label:'UAE'},{value:'Others',label:'Others'}]}
                        value={formData.country}
                        onChange={val => handleChange('country', val)}
                      />
                    </div>
                    <div className="field-group">
                      <label>Base Currency</label>
                      <input placeholder="INR" value={formData.currency} onChange={e => handleChange('currency', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Primary Phone <span style={{color:'red'}}>*</span></label>
                      <input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                    </div>
                    <div className="field-group">
                      <label>Corporate Website</label>
                      <input value={formData.website} onChange={e => handleChange('website', e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Global GST / Tax Number</label>
                    <input value={formData.gstNumber} onChange={e => handleChange('gstNumber', e.target.value)} />
                  </div>
                  {isFoodBusiness && (
                    <div className="field-group">
                      <label>FSSAI License (Global)</label>
                      <input value={formData.fssaiNumber} onChange={e => handleChange('fssaiNumber', e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="grid-section">
                  <div className="section-header"><FaPalette /> Branding & UI</div>
                  <div className="field-group">
                    <label>Global Logo (Grayscale Applied)</label>
                    <div className="logo-upload-wrapper">
                      {formData.logoUrl && (
                        <div className="logo-edit-preview">
                          <img src={formData.logoUrl} alt="Logo Preview" />
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))} className="remove-logo-btn"><FaTimes /></button>
                        </div>
                      )}
                      <label className="file-input-label">
                        <FaImage /> {formData.logoUrl ? "Change Logo" : "Upload PNG/JPG"}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
                      </label>
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Brand Primary Color</label>
                    <div className="color-picker-group" style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" value={formData.brandColor} onChange={e => handleChange('brandColor', e.target.value)} style={{ width: '45px', padding: '2px' }} />
                      <input value={formData.brandColor} onChange={e => handleChange('brandColor', e.target.value)} style={{ flex: 1 }} />
                    </div>
                  </div>
                </div>

                <div className="grid-section">
                  <div className="section-header"><FaClock /> Operational Context</div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Global Timezone</label>
                      <NiceSelect 
                        options={[{value:'UTC+5:30 (India)',label:'India (GMT+5:30)'}, {value:'UTC+4:00 (UAE)',label:'UAE (GMT+4:00)'}, {value:'UTC+0:00 (London)',label:'UK (GMT+0:00)'}]}
                        value={formData.timezone}
                        onChange={val => handleChange('timezone', val)}
                      />
                    </div>
                    <div className="field-group">
                      <label>Primary Language</label>
                      <NiceSelect 
                        options={[{value:'English',label:'English'}, {value:'Arabic',label:'Arabic'}, {value:'Hindi',label:'Hindi'}]}
                        value={formData.primaryLanguage}
                        onChange={val => handleChange('primaryLanguage', val)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid-section">
                  <div className="section-header"><FaInstagram /> Social & Engagement</div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Instagram URL</label>
                      <input value={formData.instagramUrl} onChange={e => handleChange('instagramUrl', e.target.value)} placeholder="instagram.com/yourbiz" />
                    </div>
                    <div className="field-group">
                      <label>WhatsApp Business</label>
                      <input value={formData.whatsappNumber} onChange={e => handleChange('whatsappNumber', e.target.value)} placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Facebook Page</label>
                    <input value={formData.facebookUrl} onChange={e => handleChange('facebookUrl', e.target.value)} placeholder="facebook.com/yourbiz" />
                  </div>
                </div>

                <div className="grid-section">
                  <div className="section-header"><FaUniversity /> Financial Settlements</div>
                  <div className="field-group">
                    <label>Bank Name</label>
                    <input value={formData.bankName} onChange={e => handleChange('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Account Number</label>
                      <input value={formData.accountNumber} onChange={e => handleChange('accountNumber', e.target.value)} placeholder="Account No." />
                    </div>
                    <div className="field-group">
                      <label>IFSC / SWIFT</label>
                      <input value={formData.ifscCode} onChange={e => handleChange('ifscCode', e.target.value)} placeholder="IFSC Code" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-footer">
                 {message && <span className={`status-msg ${msgType}`}>{message}</span>}
                 <button type="submit" className="save-submit" disabled={saving}>
                   {saving ? "Updating..." : <><FaSave /> Save Global Details</>}
                 </button>
              </div>
            </form>
          </div>
        ) : isChangingPassword ? (
          <div className="edit-view-container security-focus">
             <div className="security-panel full-width-panel">
                <div className="section-header"><FaLock /> Update Account Security</div>
                <p className="section-desc">Keep your main account safe by updating your password regularly.</p>
                <form onSubmit={handlePasswordChange} className="password-form">
                   <div className="field-row">
                      <div className="field-group">
                         <label>Current Password <span style={{color:'red'}}>*</span></label>
                         <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                      </div>
                      <div className="field-group">
                         <label>New Password <span style={{color:'red'}}>*</span></label>
                         <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                      </div>
                   </div>
                   <div className="security-footer">
                      <button type="submit" className="update-pass-btn">Change Password</button>
                      <button type="button" onClick={() => setIsChangingPassword(false)} className="cancel-btn">Back to Profile</button>
                   </div>
                   {passMessage && <div className={`pass-status ${passMessage.type}`}>{passMessage.text}</div>}
                </form>
             </div>
          </div>
        ) : (
          <div className="view-mode-grid">
             <div className="info-card">
               <div className="card-lbl">Primary Contact</div>
               <div className="info-rows">
                  <div className="info-row"><b>Admin Email:</b> <span>{formData.email}</span></div>
                  <div className="info-row"><b>Contact Phone:</b> <span>{formData.phone || 'Not set'}</span></div>
                  <div className="info-row"><b>Corporate Web:</b> <a href={formData.website} target="_blank" rel="noreferrer">{formData.website || 'None'}</a></div>
               </div>
             </div>

             <div className="info-card">
               <div className="card-lbl">Legal Identity</div>
               <div className="info-rows">
                  <div className="info-row"><b>Category:</b> <span>{formData.posType}</span></div>
                  <div className="info-row"><b>Region:</b> <span>{formData.country}</span></div>
                  <div className="info-row"><b>Currency:</b> <span>{formData.currency}</span></div>
               </div>
             </div>

             <div className="info-card large-card">
               <div className="card-lbl">Global Compliance</div>
               <div className="info-rows">
                  <div className="info-row"><b>GST Number:</b> <span>{formData.gstNumber || 'N/A'}</span></div>
                  {isFoodBusiness && <div className="info-row"><b>FSSAI Global:</b> <span>{formData.fssaiNumber || 'N/A'}</span></div>}
               </div>
               
               <div className="hz-divider"></div>
               
               <div className="card-lbl">Banking Details (Settlements)</div>
               <div className="info-rows">
                  <div className="info-row"><b>Bank Name:</b> <span>{formData.bankName || 'N/A'}</span></div>
                  <div className="info-row"><b>Account No:</b> <span>{formData.accountNumber || 'N/A'}</span></div>
                  <div className="info-row"><b>IFSC Code:</b> <span>{formData.ifscCode || 'N/A'}</span></div>
               </div>
             </div>

             <div className="info-card">
                <div className="card-lbl">Branding & Identity</div>
                <div className="branding-preview">
                   {formData.logoUrl ? (
                     <img src={formData.logoUrl} alt="Business Logo" className="preview-logo" />
                   ) : (
                     <div className="no-logo">No Global Logo</div>
                   )}
                   <div className="color-swatch-row">
                      <b>Primary Color:</b>
                      <div className="swatch" style={{ background: formData.brandColor }}></div>
                      <span>{formData.brandColor}</span>
                   </div>
                </div>
             </div>

             <div className="info-card">
                <div className="card-lbl">Global Settings</div>
                <div className="info-rows">
                   <div className="info-row"><b>Timezone:</b> <span>{formData.timezone}</span></div>
                   <div className="info-row"><b>Language:</b> <span>{formData.primaryLanguage}</span></div>
                </div>
             </div>

             <div className="info-card">
                <div className="card-lbl">Social Presence</div>
                <div className="info-rows">
                   <div className="info-row"><b>Instagram:</b> <span>{formData.instagramUrl || 'Not set'}</span></div>
                   <div className="info-row"><b>Facebook:</b> <span>{formData.facebookUrl || 'Not set'}</span></div>
                   <div className="info-row"><b>WhatsApp:</b> <span>{formData.whatsappNumber || 'Not set'}</span></div>
                </div>
             </div>

             <div className="info-card">
                <div className="card-lbl">Account Security</div>
                <div className="security-action-box">
                   <button onClick={() => setIsChangingPassword(true)} className="change-pass-trigger">
                      <FaLock /> Update Main Password
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .profile-wrapper { width: 100%; }
        
        .profile-top-bar { 
          display: flex; justify-content: space-between; align-items: center; 
          background: white; padding: 24px 32px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;
        }
        .business-summary { display: flex; align-items: center; gap: 20px; }
        .biz-avatar { width: 56px; height: 56px; background: #f8fafc; color: #f97316; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; border: 1px solid #f1f5f9; }
        .biz-meta h2 { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
        .biz-meta span { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

        .top-actions { display: flex; gap: 12px; }
        .edit-btn { background: #f97316; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2); }
        .cancel-btn { background: #fff; color: #64748b; border: 1px solid #e2e8f0; padding: 12px 24px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; }

        .view-mode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 24px; }
        .info-card { background: white; padding: 28px; border-radius: 24px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .large-card { grid-row: span 2; }
        .card-lbl { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px; }
        .info-rows { display: flex; flex-direction: column; gap: 14px; }
        .info-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f8fafc; padding-bottom: 10px; font-size: 14px; }
        .info-row b { color: #64748b; font-weight: 600; }
        .info-row span, .info-row a { color: #0f172a; font-weight: 700; text-decoration: none; }
        .info-row a:hover { color: #f97316; }
        .hz-divider { height: 1px; background: #f1f5f9; margin: 20px 0; }

        .branding-preview { display: flex; flex-direction: column; gap: 16px; align-items: center; }
        .preview-logo { max-width: 140px; max-height: 80px; object-fit: contain; }
        .no-logo { padding: 20px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; font-size: 12px; font-weight: 700; color: #94a3b8; }
        .color-swatch-row { display: flex; align-items: center; gap: 12px; font-size: 14px; }
        .swatch { width: 32px; height: 32px; border-radius: 8px; border: 2px solid #fff; box-shadow: 0 0 0 1px #e2e8f0; }

        .logo-upload-wrapper { display: flex; align-items: center; gap: 20px; margin-top: 8px; }
        .logo-edit-preview { position: relative; width: 60px; height: 60px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
        .logo-edit-preview img { width: 100%; height: 100%; object-fit: contain; }
        .remove-logo-btn { position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.5); color: white; border: none; font-size: 10px; cursor: pointer; padding: 4px; }
        .file-input-label { background: #f8fafc; color: #1e293b; border: 1.5px dashed #cbd5e1; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
        .file-input-label:hover { border-color: #f97316; color: #f97316; }

        .edit-view-container { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
        .edit-view-container.single-column { grid-template-columns: 1fr; }
        .compact-form { background: white; padding: 32px; border-radius: 24px; border: 1px solid #e2e8f0; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .section-header { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 18px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .grid-section { display: flex; flex-direction: column; gap: 16px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-group label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .field-group input, .field-group textarea { padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-family: inherit; font-size: 14px; font-weight: 600; color: #000; transition: all 0.2s; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .security-focus { justify-content: center; }
        .full-width-panel { grid-column: 1 / -1; max-width: 800px; margin: 0 auto; width: 100%; background: white !important; padding: 40px !important; border-radius: 24px; border: 1px solid #e2e8f0; }
        .section-desc { font-size: 14px; color: #64748b; margin-bottom: 32px; font-weight: 500; }
        .password-form { display: flex; flex-direction: column; gap: 16px; }
        .security-footer { display: flex; gap: 16px; margin-top: 10px; }
        .update-pass-btn { background: #1e293b; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
        .pass-status { font-size: 12px; font-weight: 700; text-align: center; margin-top: 10px; }
        .pass-status.success { color: #16a34a; }
        .pass-status.error { color: #ef4444; }

        .security-action-box { display: flex; justify-content: center; padding: 10px 0; }
        .change-pass-trigger { background: #f8fafc; border: 1.5px dashed #cbd5e1; color: #1e293b; padding: 14px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: 0.2s; width: 100%; justify-content: center; }
        .change-pass-trigger:hover { border-color: #f97316; color: #f97316; background: #fff7ed; }

        .form-footer { margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px; display: flex; justify-content: flex-end; align-items: center; gap: 20px; }
        .save-submit { background: #1e293b; color: white; border: none; padding: 14px 40px; border-radius: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: 0.2s; }
        .save-submit:hover { background: #000; transform: translateY(-1px); }
        .status-msg { font-size: 13px; font-weight: 700; }
        .status-msg.success { color: #16a34a; }
        .status-msg.error { color: #ef4444; }

        .loading-state { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #64748b; }

        @media (max-width: 1024px) {
          .edit-view-container { grid-template-columns: 1fr; }
          .view-mode-grid { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
           .profile-top-bar { flex-direction: column; align-items: flex-start; gap: 20px; padding: 20px; }
           .business-summary { gap: 12px; }
           .biz-avatar { width: 44px; height: 44px; font-size: 20px; }
           .biz-meta h2 { font-size: 18px; }
           .compact-form { padding: 20px; }
           .field-row { grid-template-columns: 1fr; }
           .top-actions { width: 100%; }
           .edit-btn, .cancel-btn { width: 100%; justify-content: center; }
           .save-submit { width: 100%; justify-content: center; }
        }
      `}</style>
    </DashboardLayout>
  );
}
