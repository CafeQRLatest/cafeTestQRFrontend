import React, { useState } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { hrService } from '../../services/hrService';

export default function DepartmentModal({ isOpen, onClose, departments, onRefresh }) {
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDeptName) return;

    try {
      setIsSubmitting(true);
      await hrService.createDepartment({ name: newDeptName, description: newDeptDesc, isActive: true });
      setNewDeptName('');
      setNewDeptDesc('');
      onRefresh(); // Refresh the parent list
    } catch (error) {
      console.error('Failed to create department', error);
      alert('Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await hrService.deleteDepartment(id);
      onRefresh();
    } catch (error) {
      console.error("Failed to delete department", error);
      alert("Cannot delete department (it might be in use).");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container glass-panel">
        <div className="modal-header">
          <h2>Manage Departments</h2>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleCreate} className="create-form">
            <input 
              type="text" 
              placeholder="Department Name" 
              value={newDeptName} 
              onChange={e => setNewDeptName(e.target.value)} 
              required
            />
            <input 
              type="text" 
              placeholder="Description (Optional)" 
              value={newDeptDesc} 
              onChange={e => setNewDeptDesc(e.target.value)} 
            />
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <FaPlus /> Add
            </button>
          </form>

          <div className="list-container">
            {departments.length === 0 ? (
              <p className="empty-state">No departments created yet.</p>
            ) : (
              <ul className="item-list">
                {departments.map(dept => (
                  <li key={dept.id}>
                    <div>
                      <strong>{dept.name}</strong>
                      <span className="desc">{dept.description}</span>
                    </div>
                    <button className="icon-btn delete" onClick={() => handleDelete(dept.id)}>
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
          z-index: 9999; animation: fadeIn 0.2s ease-out;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .modal-container {
          width: 100%; max-width: 500px; border-radius: 24px; overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-header {
          padding: 24px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8); background: linear-gradient(to right, #f8fafc, #ffffff);
        }
        .modal-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
        .close-btn {
          width: 36px; height: 36px; border-radius: 12px; border: none; background: #f1f5f9; color: #64748b;
          cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }
        
        .modal-body { padding: 24px; }
        
        .create-form { display: flex; gap: 8px; margin-bottom: 24px; }
        .create-form input {
          flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1;
          outline: none; font-size: 14px;
        }
        .create-form input:focus { border-color: #3b82f6; }
        .btn-primary {
          padding: 10px 16px; border-radius: 10px; border: none; background: #3b82f6;
          color: white; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;
        }
        .btn-primary:disabled { opacity: 0.7; }

        .list-container { max-height: 300px; overflow-y: auto; }
        .item-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .item-list li {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;
        }
        .item-list li strong { display: block; color: #1e293b; font-size: 14px; }
        .item-list li .desc { font-size: 12px; color: #64748b; }
        
        .icon-btn.delete {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: #fef2f2; color: #ef4444; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .empty-state { text-align: center; color: #94a3b8; font-size: 14px; padding: 20px; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
