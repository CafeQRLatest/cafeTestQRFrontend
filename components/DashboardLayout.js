import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { FaExpand, FaCompress, FaSignOutAlt, FaBell, FaArrowLeft, FaUserCog, FaChevronDown, FaBuilding, FaDesktop, FaCrown } from 'react-icons/fa';

/**
 * DashboardLayout Component
 */
export default function DashboardLayout({ children, title, subtitle, showBack = false }) {
  const { logout, userRole, email, firstName, lastName, fullName, orgId, orgName, clientName, terminalId, terminalName } = useAuth();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const getInitials = (name, email) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="dashboard-wrapper">
      <Head>
        <title>{title} | Cafe QR</title>
      </Head>

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <Link href="/owner/main-menu" className="brand-suite">
              <span className="brand-name">CafeQR</span>
              <div className="brand-divider"></div>
            </Link>
            
            {showBack && (
              <button onClick={() => router.back()} className="back-btn" title="Go Back">
                <FaArrowLeft />
              </button>
            )}
            
            <div className="header-text">
              <h1>{title}</h1>
            </div>
          </div>

          <div className="header-right">
             <button className="icon-btn" title="Notifications">
                <FaBell />
                <span className="notif-dot"></span>
             </button>
             <button onClick={toggleFullscreen} className="ctrl-btn" title="Toggle Fullscreen">
                {isFullscreen ? <FaCompress /> : <FaExpand />}
             </button>
             
             <div className="user-menu-container" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)} 
                  className={`avatar-btn ${showUserMenu ? 'active' : ''}`}
                >
                  <div className="avatar">{getInitials(fullName, email)}</div>
                  <div className="user-info-brief">
                    <span className="user-email-text">{fullName || email?.split('@')[0]}</span>
                    <FaChevronDown className={`chevron ${showUserMenu ? 'rotate' : ''}`} />
                  </div>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="role-badge">{userRole?.replace('ROLE_', '').replace('_', ' ')}</div>
                      <p className="dropdown-user-email">{fullName || email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-context-flow">
                      <div className="flow-item">
                        <div className="flow-icon enterprise"><FaCrown /></div>
                        <div className="flow-content">
                          <span className="flow-label">Enterprise</span>
                          <span className="flow-value">{clientName || 'Standard Client'}</span>
                        </div>
                      </div>
                      <div className="flow-connector"></div>
                      <div className="flow-item">
                        <div className="flow-icon branch"><FaBuilding /></div>
                        <div className="flow-content">
                          <span className="flow-label">Branch</span>
                          <span className="flow-value">{orgName || (userRole === 'ROLE_SUPER_ADMIN' ? 'Universal Access' : (orgId ? 'Branch Context' : 'All Branches'))}</span>
                        </div>
                      </div>
                      <div className="flow-connector"></div>
                      <div className="flow-item">
                        <div className="flow-icon terminal"><FaDesktop /></div>
                        <div className="flow-content">
                          <span className="flow-label">Terminal</span>
                          <span className="flow-value">{terminalName || (userRole === 'ROLE_SUPER_ADMIN' ? 'Full Control' : (terminalId ? 'Terminal Context' : 'Manager Access'))}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button onClick={() => { setShowUserMenu(false); router.push('/admin/profile'); }} className="dropdown-item">
                      <FaUserCog /> Account Settings
                    </button>
                    <div className="dropdown-divider"></div>
                    <button onClick={logout} className="dropdown-item logout">
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </div>
                )}
             </div>
          </div>
        </header>

        <main className="content-area">
          {children}
        </main>
      </div>

      <style jsx global>{`
        body { background: #f8fafc; margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <style jsx>{`
        .dashboard-wrapper { min-height: 100vh; padding: 32px 40px; }
        @media (max-width: 768px) {
          .dashboard-wrapper { padding: 16px; }
        }
        .main-content { width: 100%; }
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        
        .header-left { display: flex; align-items: center; gap: 24px; }
        
        .brand-suite { display: flex; align-items: center; gap: 20px; }
        .brand-name { font-size: 22px; font-weight: 800; color: #f97316; letter-spacing: -1px; }
        .brand-divider { width: 1px; height: 32px; background: #e2e8f0; }

        .back-btn {
          background: none; border: none; padding: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; color: #64748b; cursor: pointer; transition: all 0.2s;
        }
        .back-btn:hover { color: #f97316; transform: translateX(-4px); }

        .header-text h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; line-height: 1.1; }
        @media (max-width: 640px) {
          .header-text h1 { font-size: 18px; }
          .brand-name { font-size: 18px; }
          .brand-divider { height: 24px; margin: 0 4px; }
          .brand-suite { gap: 8px; }
          .header-left { gap: 10px; }
        }
        .header-text p { color: #64748b; margin: 4px 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .header-right { display: flex; align-items: center; gap: 16px; }
        
        .icon-btn, .ctrl-btn {
           width: 44px; height: 44px; border-radius: 12px;
           background: white; border: 1px solid #e2e8f0;
           display: flex; align-items: center; justify-content: center;
           font-size: 18px; color: #64748b; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           position: relative;
        }
        .icon-btn:hover, .ctrl-btn:hover { border-color: #f97316; color: #f97316; background: #fff7ed; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1); }
        
        .notif-dot {
           position: absolute; top: 12px; right: 12px;
           width: 8px; height: 8px; background: #ef4444;
           border-radius: 50%; border: 2px solid white;
        }

        .user-menu-container { position: relative; }
        
        .avatar-btn {
           display: flex; align-items: center; gap: 12px;
           padding: 6px 12px 6px 6px; border-radius: 14px;
           background: white; border: 1px solid #e2e8f0;
           cursor: pointer; transition: all 0.3s;
        }
        .avatar-btn:hover, .avatar-btn.active { border-color: #f97316; background: #fff7ed; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

        .avatar {
           width: 32px; height: 32px; border-radius: 10px;
           background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
           color: white; display: flex; align-items: center; justify-content: center;
           font-weight: 800; font-size: 14px;
        }

        .user-info-brief { display: flex; align-items: center; gap: 8px; }
        .user-email-text { font-size: 13px; font-weight: 700; color: #1e293b; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chevron { font-size: 10px; color: #94a3b8; transition: transform 0.3s; }
        .chevron.rotate { transform: rotate(180deg); }

        .user-dropdown {
           position: absolute; top: calc(100% + 12px); right: 0;
           width: 240px; background: white; border-radius: 16px;
           border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
           padding: 8px; z-index: 100; animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
           from { opacity: 0; transform: translateY(10px); }
           to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header { padding: 16px 16px 12px; display: flex; flex-direction: column; gap: 8px; }
        .role-badge { 
          display: inline-flex; 
          padding: 4px 10px; 
          background: #fdf2f8; 
          color: #db2777; 
          font-size: 10px; 
          font-weight: 800; 
          border-radius: 20px; 
          text-transform: uppercase; 
          letter-spacing: 0.05em;
          width: fit-content;
          border: 1px solid #fce7f3;
        }
        .dropdown-user-email { font-size: 13px; font-weight: 600; color: #64748b; margin: 0; word-break: break-all; }
        
        .dropdown-divider { height: 1px; background: #f1f5f9; margin: 8px 0; }

        .dropdown-context-flow { 
          padding: 12px 20px; 
          display: flex;
          flex-direction: column;
        }
        .flow-item { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
        }
        .flow-icon { 
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px; 
          flex-shrink: 0; 
          border-radius: 50%;
          z-index: 1;
        }
        .flow-icon.enterprise { color: #6366f1; background: #eef2ff; border: 2px solid #ffffff; box-shadow: 0 0 0 1px #e0e7ff; }
        .flow-icon.branch { color: #f97316; background: #fff7ed; border: 2px solid #ffffff; box-shadow: 0 0 0 1px #ffedd5; }
        .flow-icon.terminal { color: #0ea5e9; background: #f0f9ff; border: 2px solid #ffffff; box-shadow: 0 0 0 1px #e0f2fe; }
        
        .flow-connector {
          width: 2px;
          height: 12px;
          background: #f1f5f9;
          margin-left: 13px;
        }

        .flow-content { 
          display: flex; 
          flex-direction: column; 
          min-width: 0;
        }
        .flow-label { 
          font-size: 9px; 
          font-weight: 800; 
          color: #94a3b8; 
          text-transform: uppercase; 
          letter-spacing: 0.08em; 
        }
        .flow-value { 
          font-size: 13px; 
          font-weight: 700; 
          color: #334155; 
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dropdown-item {
           width: 100%; display: flex; align-items: center; gap: 12px;
           padding: 12px 16px; border-radius: 10px; border: none;
           background: transparent; color: #475569; font-size: 14px; font-weight: 600;
           cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .dropdown-item:hover { background: #f8fafc; color: #f97316; }
        .dropdown-item.logout { color: #ef4444; }
        .dropdown-item.logout:hover { background: #fef2f2; }

        @media (max-width: 768px) {
           .dashboard-header { margin-bottom: 24px; }
           .header-right { gap: 10px; }
           .icon-btn, .ctrl-btn { width: 40px; height: 40px; font-size: 16px; }
           .ctrl-btn { display: none; }
           .avatar-btn { padding: 4px 8px 4px 4px; gap: 8px; }
           .user-email-text { display: none; }
        }
      `}</style>
    </div>
  );
}
