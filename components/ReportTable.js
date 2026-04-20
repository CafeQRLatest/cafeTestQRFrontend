import React from 'react';
import { FaInbox } from 'react-icons/fa';

/**
 * ReportTable — A shared, professional data-table component for report pages.
 * 
 * Props:
 *   columns    — Array of { key, label, align?, render?, width? }
 *   data       — Array of row objects
 *   emptyIcon  — React element (icon) for the empty state
 *   emptyTitle — Title for empty state
 *   emptyText  — Description for empty state
 *   footer     — Optional React element for the table footer row
 *   accentColor — Optional hex color for hover accents (default: #f97316)
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
    <div className="rt-wrapper">
      <table className="rt-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={col.key || idx} 
                className={col.align === 'right' ? 'rt-right' : col.align === 'center' ? 'rt-center' : ''}
                style={col.width ? { width: col.width } : {}}
                onClick={col.onSort || undefined}
              >
                <span className={`rt-th-inner ${col.onSort ? 'sortable' : ''}`}>
                  {col.label}
                  {col.sortIcon && <span className="rt-sort-icon">{col.sortIcon}</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx} className="rt-row">
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
                <div className="rt-empty">
                  <div className="rt-empty-icon">{emptyIcon || <FaInbox />}</div>
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
        .rt-wrapper {
          background: white;
          border-radius: 20px;
          border: 1px solid #edf2f7;
          overflow-x: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .rt-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        /* ─── Head ─── */
        .rt-table thead tr {
          background: #fafbfc;
        }
        .rt-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 2px solid #f1f5f9;
          white-space: nowrap;
          user-select: none;
        }
        .rt-table th:first-child { border-radius: 20px 0 0 0; }
        .rt-table th:last-child  { border-radius: 0 20px 0 0; }
        .rt-th-inner { display: inline-flex; align-items: center; gap: 4px; }
        .rt-th-inner.sortable { cursor: pointer; transition: color 0.2s; }
        .rt-th-inner.sortable:hover { color: ${accentColor}; }
        .rt-sort-icon { font-size: 10px; display: inline-flex; }

        /* ─── Body ─── */
        .rt-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .rt-row {
          transition: background 0.15s;
        }
        .rt-row:hover {
          background: rgba(249, 115, 22, 0.02);
        }
        .rt-row:last-child td {
          border-bottom: none;
        }

        /* ─── Alignment ─── */
        .rt-right { text-align: right; }
        .rt-center { text-align: center; }

        /* ─── Footer ─── */
        .rt-table tfoot td {
          padding: 18px 20px;
          background: #f8fafb;
          border-top: 2px solid #e2e8f0;
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
        }

        /* ─── Empty State ─── */
        .rt-empty {
          padding: 72px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .rt-empty-icon {
          font-size: 48px;
          color: #e2e8f0;
          margin-bottom: 20px;
          opacity: 0.6;
        }
        .rt-empty h3 {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 900;
          color: #1e293b;
        }
        .rt-empty p {
          margin: 0;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
          max-width: 320px;
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .rt-table th, .rt-table td {
            padding: 12px 14px;
          }
        }
      `}</style>
    </div>
  );
}
