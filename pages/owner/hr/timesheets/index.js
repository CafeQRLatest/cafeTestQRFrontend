import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../../../../components/DashboardLayout';
import { FaClock, FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function TimesheetsDashboard() {
  const [timesheets, setTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real scenario, this would call hrService.getAttendances()
    // For now, we mock some timesheets based on our implementation plan
    setTimesheets([
      {
        id: '1',
        employeeName: 'Jane Smith',
        date: new Date().toISOString().split('T')[0],
        clockInTime: '08:00 AM',
        clockOutTime: '05:00 PM',
        totalHours: 9,
        isOvertime: true,
        punchMethod: 'FACE_SCAN'
      },
      {
        id: '2',
        employeeName: 'John Doe',
        date: new Date().toISOString().split('T')[0],
        clockInTime: '09:00 AM',
        clockOutTime: '02:00 PM',
        totalHours: 5,
        isOvertime: false,
        punchMethod: 'PIN'
      }
    ]);
  }, []);

  return (
    <DashboardLayout title="Timesheets & Overrides" subtitle="Manage manual overrides for staff attendance">
      <Head>
        <title>Timesheets | Cafe QR</title>
      </Head>

      <div className="timesheets-wrapper">
        <div className="info-alert glass-panel">
          <FaClock className="alert-icon" />
          <div>
            <h3>Manager Overrides</h3>
            <p>If an employee forgot to clock in via the Kiosk, you can manually adjust their timecard here to ensure accurate payroll calculations.</p>
          </div>
        </div>

        <div className="table-container glass-panel">
          {isLoading ? (
            <div className="loading-state">Loading timesheets...</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Hours</th>
                  <th>Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">No timesheets recorded today.</td>
                  </tr>
                ) : (
                  timesheets.map(record => (
                    <tr key={record.id}>
                      <td className="font-bold">{record.employeeName}</td>
                      <td>{record.date}</td>
                      <td className="time-badge in">{record.clockInTime}</td>
                      <td className="time-badge out">{record.clockOutTime || 'Active'}</td>
                      <td>
                        {record.totalHours} hrs
                        {record.isOvertime && <span className="overtime-flag"><FaExclamationTriangle /> OT</span>}
                      </td>
                      <td>
                        <span className={`method-badge ${record.punchMethod.toLowerCase()}`}>
                          {record.punchMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit"><FaEdit /></button>
                          <button className="icon-btn delete"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        .timesheets-wrapper { display: flex; flex-direction: column; gap: 24px; animation: slideUp 0.4s ease-out; }
        
        .glass-panel {
          background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .info-alert {
          display: flex; align-items: flex-start; gap: 16px; padding: 24px;
          background: linear-gradient(to right, #eff6ff, #f8fafc);
          border-left: 4px solid #3b82f6;
        }
        .alert-icon { font-size: 24px; color: #3b82f6; margin-top: 4px; }
        .info-alert h3 { margin: 0 0 8px; color: #1e293b; font-size: 16px; }
        .info-alert p { margin: 0; color: #475569; font-size: 14px; }

        .table-container { overflow-x: auto; }
        .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
        .modern-table th {
          padding: 16px 24px; font-size: 12px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;
        }
        .modern-table td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        
        .font-bold { font-weight: 700; color: #1e293b; }
        
        .time-badge { font-family: monospace; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
        .time-badge.in { background: #dcfce7; color: #15803d; }
        .time-badge.out { background: #f1f5f9; color: #475569; }

        .overtime-flag {
          display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;
          padding: 2px 6px; background: #fef2f2; color: #ef4444; border-radius: 4px; font-size: 10px; font-weight: 800;
        }

        .method-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .method-badge.face_scan { background: #dbeafe; color: #1d4ed8; }
        .method-badge.pin { background: #fef3c7; color: #b45309; }

        .action-buttons { display: flex; gap: 8px; }
        .icon-btn {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .icon-btn.edit { background: #f1f5f9; color: #3b82f6; }
        .icon-btn.edit:hover { background: #dbeafe; }
        .icon-btn.delete { background: #fef2f2; color: #ef4444; }
        .icon-btn.delete:hover { background: #fee2e2; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </DashboardLayout>
  );
}
