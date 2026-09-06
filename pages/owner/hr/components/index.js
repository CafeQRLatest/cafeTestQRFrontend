import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../../../../components/DashboardLayout';
import { hrService } from '../../../../services/hrService';
import { FaPlus, FaCogs, FaEdit } from 'react-icons/fa';

export default function SalaryComponents() {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Create Form
  const [name, setName] = useState('');
  const [type, setType] = useState('EARNING');
  const [amountType, setAmountType] = useState('FIXED');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [isTaxApplicable, setIsTaxApplicable] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await hrService.getAllComponents();
      setComponents(res.data || []);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComponent = async (e) => {
    e.preventDefault();
    if (!name) return;
    
    try {
      await hrService.createComponent({
        name,
        type,
        amountType,
        defaultAmount: amountType === 'FIXED' ? parseFloat(defaultAmount) : null,
        percentage: amountType === 'PERCENTAGE' ? parseFloat(percentage) : null,
        isTaxApplicable,
        isActive: true
      });
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert("Error creating component.");
    }
  };

  return (
    <DashboardLayout title="Salary Rules Engine" subtitle="Configure earnings, deductions, taxes, and bonuses.">
      <Head>
        <title>Salary Rules | Cafe QR</title>
      </Head>

      <div className="flex justify-end mb-6">
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> New Component
        </button>
      </div>

      <div className="table-container glass-panel">
        {isLoading ? (
          <div className="loading-state">Loading components...</div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Category</th>
                <th>Calculation Type</th>
                <th>Default Value</th>
                <th>Taxable?</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {components.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">No salary components defined.</td>
                </tr>
              ) : (
                components.map(comp => (
                  <tr key={comp.id}>
                    <td className="font-bold flex items-center gap-3">
                      <div className={`icon-box ${comp.type.toLowerCase()}`}><FaCogs /></div>
                      {comp.name}
                    </td>
                    <td><span className={`type-badge ${comp.type.toLowerCase()}`}>{comp.type}</span></td>
                    <td>{comp.amountType}</td>
                    <td className="font-bold">
                      {comp.amountType === 'FIXED' ? `$${comp.defaultAmount?.toFixed(2)}` : `${comp.percentage}% of Gross`}
                    </td>
                    <td>{comp.isTaxApplicable ? "Yes" : "No"}</td>
                    <td><span className={comp.isActive ? "status-badge approved" : "status-badge rejected"}>{comp.isActive ? "ACTIVE" : "INACTIVE"}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3>Create Salary Rule</h3>
            <form onSubmit={handleCreateComponent}>
              <div className="form-group mb-4">
                <label>Rule Name (e.g., "Health Insurance")</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label>Category</label>
                  <select value={type} onChange={e => setType(e.target.value)}>
                    <option value="EARNING">Earning / Bonus</option>
                    <option value="DEDUCTION">Deduction / Tax</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Calculation Type</label>
                  <select value={amountType} onChange={e => setAmountType(e.target.value)}>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
              </div>
              
              {amountType === 'FIXED' ? (
                <div className="form-group mb-4">
                  <label>Default Amount ($)</label>
                  <input type="number" step="0.01" value={defaultAmount} onChange={e => setDefaultAmount(e.target.value)} required />
                </div>
              ) : (
                <div className="form-group mb-4">
                  <label>Percentage of Gross Pay (%)</label>
                  <input type="number" step="0.01" value={percentage} onChange={e => setPercentage(e.target.value)} required />
                </div>
              )}

              <div className="form-group flex items-center gap-3 mb-6">
                <input type="checkbox" id="taxable" checked={isTaxApplicable} onChange={e => setIsTaxApplicable(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="taxable" className="!mb-0 cursor-pointer">Is this component subject to payroll taxes?</label>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .table-container { overflow-x: auto; }
        .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
        .modern-table th { padding: 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        .modern-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; }
        .font-bold { font-weight: 700; color: #1e293b; }
        
        .icon-box { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .icon-box.earning { background: #dcfce7; color: #15803d; }
        .icon-box.deduction { background: #fee2e2; color: #b91c1c; }

        .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .status-badge.approved { background: #dcfce7; color: #15803d; }
        .status-badge.rejected { background: #fee2e2; color: #b91c1c; }

        .type-badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .type-badge.earning { background: #e0e7ff; color: #4338ca; }
        .type-badge.deduction { background: #ffedd5; color: #c2410c; }

        .btn-primary { display: flex; gap: 8px; align-items: center; padding: 10px 20px; border-radius: 12px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; font-weight: 600; border: none; cursor: pointer; }
        .btn-secondary { padding: 10px 20px; border-radius: 12px; background: #f1f5f9; color: #475569; font-weight: 600; border: none; cursor: pointer; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .modal-content { width: 100%; max-width: 500px; padding: 32px; background: white; border-radius: 20px; }
        .modal-content h3 { margin: 0 0 24px; font-size: 20px; }
        
        .form-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #475569; }
        .form-group input, .form-group select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; }
      `}</style>
    </DashboardLayout>
  );
}
