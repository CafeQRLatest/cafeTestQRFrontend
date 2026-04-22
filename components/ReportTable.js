import React from 'react';
import { FaInbox } from 'react-icons/fa';

/**
 * ReportTable — A global, premium data-table component for all system reports.
 */
export default function ReportTable({ 
  columns = [], 
  data = [], 
  emptyIcon = null, 
  emptyTitle = 'No records found', 
  emptyText = 'Adjust your filters or try a different search.',
  footer = null,
  accentColor = '#f97316'
}) {
  return (
    <div className="table-container">
      <table className="premium-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={col.key || idx} 
                className={col.align === 'right' ? 'rt-right' : col.align === 'center' ? 'rt-center' : ''}
                style={col.width ? { width: col.width } : {}}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx}>
                {columns.map((col, colIdx) => (
                  <td 
                    key={col.key || colIdx}
                    className={col.align === 'right' ? 'rt-right' : col.align === 'center' ? 'rt-center' : ''}
                  >
                    {col.render ? col.render(row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty-cell">
                  <div className="empty-icon">{emptyIcon || <FaInbox />}</div>
                  <h3>{emptyTitle}</h3>
                  <p>{emptyText}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
        {footer && data.length > 0 && (
          <tfoot>
            {footer}
          </tfoot>
        )}
      </table>

      <style jsx>{`
        .table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .premium-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
          min-width: 700px;
        }
        .premium-table th {
          padding: 14px 20px;
          background: linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%);
          color: #1f2937;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid ${accentColor};
          white-space: nowrap;
        }
        .premium-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          vertical-align: middle;
          font-weight: 600;
        }
        .premium-table tbody tr:last-child td {
          border-bottom: none;
        }
        .premium-table tbody tr:hover {
          background-color: #fafafa;
        }
        .rt-right { text-align: right; }
        .rt-center { text-align: center; }
        
        .empty-cell {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .empty-icon {
          font-size: 40px;
          color: #e5e7eb;
          margin-bottom: 16px;
        }
        .empty-cell h3 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 800;
          color: #1f2937;
        }
        .empty-cell p {
          margin: 0;
          font-size: 13px;
          color: #9ca3af;
        }
        
        tfoot td {
          padding: 16px 20px;
          background: #f9fafb;
          border-top: 2px solid #e5e7eb;
          font-weight: 800;
          color: #111827;
        }
      `}</style>
    </div>
  );
}
