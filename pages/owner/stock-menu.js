import React from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import RoleGate from '../../components/RoleGate';
import { 
  FaBoxes, FaExchangeAlt, FaBalanceScale, FaChartBar, FaHistory,
  FaDollarSign, FaFileAlt, FaClipboardList, FaArrowRight, FaWarehouse
} from 'react-icons/fa';

const stockModules = [
  {
    title: 'Stock Overview',
    desc: 'Real-time inventory balances across all warehouses',
    href: '/owner/stock-overview',
    icon: <FaBoxes />,
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
  },
  {
    title: 'Stock Transfer',
    desc: 'Move inventory between warehouse locations',
    href: '/owner/stock-transfers',
    icon: <FaExchangeAlt />,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
  },
  {
    title: 'Stock Adjustment',
    desc: 'Audit corrections, wastage & damage logging',
    href: '/owner/stock-adjustments',
    icon: <FaBalanceScale />,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
  },
  {
    title: 'Stock Valuation',
    desc: 'Total inventory worth by warehouse & product',
    href: '/owner/stock-valuation',
    icon: <FaDollarSign />,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
  },
  {
    title: 'Transfer Reports',
    desc: 'Track all inter-warehouse movements & status',
    href: '/owner/stock-transfer-reports',
    icon: <FaFileAlt />,
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
  },
  {
    title: 'Adjustment Reports',
    desc: 'Complete audit trail of stock corrections',
    href: '/owner/stock-adjustment-reports',
    icon: <FaClipboardList />,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
  },
  {
    title: 'Stock Ledger',
    desc: 'Immutable transaction history & event log',
    href: '/owner/stock-history',
    icon: <FaHistory />,
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
  }
];

export default function StockMenuPage() {
  return (
    <RoleGate allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']}>
      <DashboardLayout title="Stock Management">

        {/* Module Grid */}
        <div className="module-grid" style={{ marginTop: '20px' }}>
          {stockModules.map((mod, idx) => (
            <Link href={mod.href} key={idx} className="module-card">
              <div className="card-glow" style={{ background: `${mod.color}10` }}></div>
              <div className="card-header">
                <div className="module-icon" style={{ background: `${mod.color}12`, color: mod.color }}>
                  {mod.icon}
                </div>
                <FaArrowRight className="card-arrow" style={{ color: mod.color }} />
              </div>
              <div className="card-body">
                <h3>{mod.title}</h3>
              </div>
              <div className="card-accent" style={{ background: mod.gradient }}></div>
            </Link>
          ))}
        </div>

        <style jsx>{`
          .stock-hero {
            background: white;
            border-radius: 24px;
            padding: 40px;
            border: 1px solid #edf2f7;
            margin-bottom: 32px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03);
          }
          .hero-bg-pattern {
            position: absolute;
            top: 0; right: 0;
            width: 400px; height: 100%;
            background: 
              radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.06) 0%, transparent 50%),
              radial-gradient(circle at 60% 80%, rgba(59, 130, 246, 0.04) 0%, transparent 50%);
            pointer-events: none;
          }
          .hero-content {
            display: flex;
            align-items: center;
            gap: 24px;
            position: relative;
            z-index: 1;
          }
          .hero-icon-wrap {
            width: 64px; height: 64px;
            background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            font-size: 28px; color: white;
            box-shadow: 0 8px 24px rgba(249, 115, 22, 0.25);
            flex-shrink: 0;
          }
          .hero-text-block h2 {
            margin: 0;
            font-size: 26px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.03em;
          }
          .hero-text-block p {
            margin: 6px 0 0;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
            max-width: 480px;
            line-height: 1.5;
          }
          .hero-stats {
            display: flex;
            gap: 12px;
            margin-top: 20px;
            position: relative;
            z-index: 1;
          }
          .hero-stat-pill {
            padding: 6px 16px;
            background: #fff7ed;
            color: #f97316;
            font-size: 12px;
            font-weight: 800;
            border-radius: 20px;
            letter-spacing: 0.02em;
          }

          .module-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }

          .module-card {
            background: white;
            border-radius: 20px;
            padding: 28px;
            border: 1px solid #edf2f7;
            position: relative;
            overflow: hidden;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            gap: 20px;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            cursor: pointer;
          }
          .module-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            border-color: transparent;
          }

          .card-glow {
            position: absolute;
            top: -60px; right: -60px;
            width: 200px; height: 200px;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.4s;
            pointer-events: none;
          }
          .module-card:hover .card-glow {
            opacity: 1;
          }

          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .module-icon {
            width: 52px; height: 52px;
            border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px;
            transition: transform 0.3s;
          }
          .module-card:hover .module-icon {
            transform: scale(1.1);
          }
          .card-arrow {
            font-size: 14px;
            opacity: 0;
            transform: translateX(-8px);
            transition: all 0.3s;
          }
          .module-card:hover .card-arrow {
            opacity: 1;
            transform: translateX(0);
          }

          .card-body h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.01em;
          }
          .card-body p {
            margin: 6px 0 0;
            font-size: 13px;
            font-weight: 500;
            color: #94a3b8;
            line-height: 1.5;
          }

          .card-accent {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 3px;
            opacity: 0;
            transition: opacity 0.3s;
          }
          .module-card:hover .card-accent {
            opacity: 1;
          }

          @media (max-width: 640px) {
            .stock-hero {
              padding: 24px;
            }
            .hero-content {
              flex-direction: column;
              text-align: center;
            }
            .hero-text-block h2 {
              font-size: 20px;
            }
            .hero-stats {
              justify-content: center;
            }
            .module-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </DashboardLayout>
    </RoleGate>
  );
}
