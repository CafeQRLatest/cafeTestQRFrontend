import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { 
  FaCheckCircle, FaExclamationCircle, FaTimes, 
  FaExclamationTriangle, FaInfoCircle 
} from 'react-icons/fa';

export default function GlobalUI() {
  const { notifications, modal, closeModal } = useNotification();

  return (
    <>
      <div className="global-toast-container">
        {notifications.map(n => (
          <div key={n.id} className={`custom-toast ${n.type}`}>
            <div className="toast-icon">
              {n.type === 'success' ? <FaCheckCircle /> : 
               n.type === 'error' ? <FaExclamationCircle /> : 
               n.type === 'warning' ? <FaExclamationTriangle /> : <FaInfoCircle />}
            </div>
            <div className="toast-content">{n.message}</div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => modal.onCancel()}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className={`modal-header-accent ${modal.type || 'warning'}`}></div>
            <div className="modal-body">
              <div className="modal-icon-big">
                {modal.type === 'error' ? <FaExclamationCircle className="error" /> : 
                 modal.type === 'info' ? <FaInfoCircle className="info" /> : 
                 <FaExclamationTriangle className="warning" />}
              </div>
              <h2>{modal.title}</h2>
              <p>{modal.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => modal.onCancel()}>Cancel</button>
              <button className={`btn-confirm ${modal.type || 'warning'}`} onClick={() => modal.onConfirm()}>
                Proceed
              </button>
            </div>
            <button className="modal-close-x" onClick={() => modal.onCancel()}><FaTimes /></button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .global-toast-container {
          position: fixed;
          top: 32px;
          right: 32px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        .custom-toast {
          padding: 16px 24px;
          background: #1e293b;
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
          min-width: 300px;
          max-width: 450px;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .custom-toast.success { border-left: 4px solid #10b981; }
        .custom-toast.error { border-left: 4px solid #ef4444; }
        .custom-toast.warning { border-left: 4px solid #f97316; }

        .toast-icon { font-size: 20px; }
        .success .toast-icon { color: #10b981; }
        .error .toast-icon { color: #ef4444; }
        .warning .toast-icon { color: #f97316; }

        .toast-content { font-size: 14px; font-weight: 700; }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-box {
          background: white;
          width: 100%;
          max-width: 440px;
          border-radius: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.2);
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-header-accent { height: 6px; width: 100%; }
        .modal-header-accent.warning { background: #f97316; }
        .modal-header-accent.error { background: #ef4444; }
        .modal-header-accent.info { background: #3b82f6; }

        .modal-body {
          padding: 40px 32px 32px;
          text-align: center;
        }

        .modal-icon-big { font-size: 56px; margin-bottom: 24px; }
        .modal-icon-big .warning { color: #f97316; }
        .modal-icon-big .error { color: #ef4444; }
        .modal-icon-big .info { color: #3b82f6; }

        .modal-body h2 { 
          margin: 0 0 12px; 
          font-size: 22px; 
          font-weight: 950; 
          color: #0f172a; 
          letter-spacing: -0.5px;
        }

        .modal-body p { 
          margin: 0; 
          font-size: 15px; 
          color: #64748b; 
          line-height: 1.6; 
          font-weight: 600;
        }

        .modal-footer {
          padding: 0 32px 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .btn-cancel {
          padding: 14px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #64748b;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-cancel:hover { background: #f1f5f9; color: #1e293b; }

        .btn-confirm {
          padding: 14px;
          border-radius: 16px;
          border: none;
          color: white;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-confirm.warning { background: #f97316; box-shadow: 0 8px 20px rgba(249,115,22,0.25); }
        .btn-confirm.warning:hover { background: #ea580c; transform: translateY(-1px); }
        
        .btn-confirm.error { background: #ef4444; box-shadow: 0 8px 20px rgba(239,68,68,0.25); }
        .btn-confirm.error:hover { background: #dc2626; transform: translateY(-1px); }

        .modal-close-x {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          color: #94a3b8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .modal-close-x:hover { background: #e2e8f0; color: #475569; }
      `}</style>
    </>
  );
}
