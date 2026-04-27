import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ReportTable from '../../components/ReportTable';
import NiceSelect from '../../components/NiceSelect';
import PremiumDateTimePicker from '../../components/PremiumDateTimePicker';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaPlus, FaTimes, FaTrash, FaEdit, FaCog, FaWallet, FaTag, FaFileAlt, FaUndo } from 'react-icons/fa';

const PAY_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'online', label: 'Online' },
  { value: 'credit', label: 'Credit' },
  { value: 'none', label: 'None / Other' }
];

export default function Expenses() {
  const { orgId, timezone } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  
  const getLocalDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getBusinessNow = () => {
    const now = new Date();
    if (!timezone) return now;
    try {
      const match = timezone.match(/UTC([+-])(\d+):(\d+)/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2]);
        const mins = parseInt(match[3]);
        const targetOffset = sign * (hours * 60 + mins);
        const localOffset = -now.getTimezoneOffset();
        const diff = targetOffset - localOffset;
        return new Date(now.getTime() + diff * 60000);
      }
    } catch (e) {}
    return now;
  };

  const [dateFrom, setDateFrom] = useState(() => getLocalDate(getBusinessNow()));
  const [dateTo, setDateTo] = useState(() => getLocalDate(getBusinessNow()));

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fDate, setFDate] = useState('');
  const [fTime, setFTime] = useState('');
  const [fCatId, setFCatId] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fMethod, setFMethod] = useState('');
  const [saving, setSaving] = useState(false);

  const [showCatMgr, setShowCatMgr] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [catActiveFilter, setCatActiveFilter] = useState('Y');

  const { notify, showConfirm } = useNotification();

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [catRes, expRes] = await Promise.all([
        api.get('/api/v1/expenses/categories'),
        api.get('/api/v1/expenses', { params: {
          start: `${dateFrom}T00:00:00`,
          end: `${dateTo}T23:59:59`
        }})
      ]);
      
      if (catRes.data.success) setCategories(catRes.data.data || []);
      if (expRes.data.success) {
        const data = expRes.data.data || [];
        setExpenses(data.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate)));
      }
    } catch (e) { 
      notify('error', 'Failed to load expense data');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, [dateFrom, dateTo]);

  const filtered = useMemo(() => {
    if (!filterCat) return expenses;
    return expenses.filter(e => String(e.categoryId) === String(filterCat));
  }, [expenses, filterCat]);

  const totalVisible = useMemo(() => filtered.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0), [filtered]);
  const totalAll = useMemo(() => expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0), [expenses]);

  const openAdd = () => {
    setEditing(null);
    const now = getBusinessNow();
    setFDate(getLocalDate(now));
    setFTime(now.toTimeString().slice(0,5));
    setFCatId(''); setFAmount(''); setFDesc(''); setFMethod('cash');
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    const d = new Date(exp.expenseDate);
    setFDate(getLocalDate(d));
    setFTime(d.toTimeString().slice(0,5));
    setFCatId(exp.categoryId || '');
    setFAmount(String(exp.amount || ''));
    setFMethod(exp.paymentMethod || 'cash');
    setFDesc(exp.description || '');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fAmount || parseFloat(fAmount) <= 0) return notify('error', 'Enter a valid amount');
    if (!fCatId) return notify('error', 'Select a category');
    if (!fMethod) return notify('error', 'Select a payment method');
    setSaving(true);
    try {
      const payload = {
        orgId: orgId,
        categoryId: fCatId,
        expenseDate: `${fDate}T${fTime}:00`,
        amount: parseFloat(fAmount),
        description: fDesc || null,
        paymentMethod: fMethod
      };
      if (editing) {
        await api.put(`/api/v1/expenses/${editing.id}`, payload);
        notify('success', 'Expense updated');
      } else {
        await api.post('/api/v1/expenses', payload);
        notify('success', 'Expense added');
      }
      setShowForm(false); setEditing(null);
      await loadData(true);
    } catch (err) { 
      notify('error', err.response?.data?.message || 'Failed to save'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Expense?',
      message: 'This action cannot be undone.',
      type: 'error',
      onConfirm: async () => {
        try {
          await api.delete(`/api/v1/expenses/${id}`);
          notify('success', 'Expense deleted');
          await loadData(true);
        } catch (err) { notify('error', 'Failed to delete'); }
      }
    });
  };

  const addCategory = async () => {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      const res = await api.post('/api/v1/expenses/categories', { name: catName.trim(), sortOrder: 99 });
      if (res.data.success) {
        const newCat = res.data.data;
        setCatName('');
        notify('success', 'Category added');
        await loadData(true);
        // Auto-select the new category in the form
        if (newCat && newCat.id) setFCatId(newCat.id);
        // Close manager to return to form
        setShowCatMgr(false);
      }
    } catch (e) { notify('error', 'Failed to add category'); }
    finally { setCatSaving(false); }
  };

  const toggleCatActive = (cat) => {
    // Check both potential naming conventions to be safe
    const currentStatus = cat.isActive || cat.isactive || 'Y';
    const isY = currentStatus.toUpperCase() === 'Y';
    
    showConfirm({
      title: isY ? 'Mark Inactive?' : 'Restore Category?',
      message: `Are you sure you want to ${isY ? 'mark as inactive' : 'restore'} "${cat.name}"?`,
      type: isY ? 'error' : 'success',
      onConfirm: async () => {
        try {
          // Send both naming conventions to ensure backend captures the update
          await api.put(`/api/v1/expenses/categories/${cat.id}`, { 
            id: cat.id,
            name: cat.name,
            sortOrder: cat.sortOrder || 0,
            isActive: isY ? 'N' : 'Y',
            isactive: isY ? 'N' : 'Y'
          });
          notify('success', `Category ${isY ? 'marked inactive' : 'restored'}`);
          await loadData(true);
        } catch (e) { notify('error', 'Operation failed'); }
      }
    });
  };

  const prettyMethod = (m) => {
    if (!m || m === 'none') return 'Other';
    return m.charAt(0).toUpperCase() + m.slice(1);
  };

  const sym = '₹';

  return (
    <DashboardLayout title="Expenses">
      <div className="exp-page">
        <div className="exp-controls">
          <div className="exp-dates">
            <PremiumDateTimePicker value={`${dateFrom}T00:00`} onChange={v => setDateFrom(v.slice(0,10))} />
            <span className="exp-to">→</span>
            <PremiumDateTimePicker value={`${dateTo}T23:59`} onChange={v => setDateTo(v.slice(0,10))} />
          </div>
          <div className="exp-actions">
            <button className="exp-btn primary" onClick={openAdd}>+ Add Expense</button>
            <button className="exp-btn ghost" onClick={() => setShowCatMgr(true)}><FaCog /> Categories</button>
          </div>
        </div>

        <div className="exp-kpis">
          <div className="exp-kpi card-volume">
            <div className="kpi-hdr">
              <span className="kpi-label">Total Volume</span>
              <div className="kpi-icon-circle red"><FaWallet /></div>
            </div>
            <div className="kpi-body">
              <span className="kpi-value red-text">{sym}{totalAll.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              <span className="kpi-subtext">Total outflow this period</span>
            </div>
          </div>
          
          <div className="exp-kpi card-count">
            <div className="kpi-hdr">
              <span className="kpi-label">Transaction Count</span>
              <div className="kpi-icon-circle blue"><FaFileAlt /></div>
            </div>
            <div className="kpi-body">
              <span className="kpi-value">{expenses.length}</span>
              <span className="kpi-subtext">Items recorded</span>
            </div>
          </div>

          {filterCat && (
            <div className="exp-kpi card-filter">
              <div className="kpi-hdr">
                <span className="kpi-label">Filtered View</span>
                <div className="kpi-icon-circle orange"><FaTag /></div>
              </div>
              <div className="kpi-body">
                <span className="kpi-value orange-text">{sym}{totalVisible.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className="kpi-subtext">Selected category total</span>
              </div>
            </div>
          )}
        </div>

        <div className="exp-filter-row">
          <NiceSelect 
            value={filterCat} 
            onChange={setFilterCat} 
            options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
            style={{ width: '200px' }}
          />
          {filterCat && <button className="exp-clear" onClick={() => setFilterCat('')}>Clear Filter</button>}
        </div>

        {loading ? (
          <div className="exp-loading">Synchronizing records…</div>
        ) : (
          <ReportTable
            accentColor="#f97316"
            columns={[
              { key: 'expenseDate', label: 'Timestamp', width: '140px', render: (r) => {
                const d = new Date(r.expenseDate);
                return (
                  <div className="row-date">
                    <span className="rd-d">{d.toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}</span>
                    <span className="rd-t">{d.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', hour12:true})}</span>
                  </div>
                );
              }},
              { key: 'categoryId', label: 'Category', render: (r) => {
                const cat = categories.find(c => String(c.id) === String(r.categoryId));
                return (
                  <div className="row-cat">
                    <span className="rc-text">{cat ? cat.name : (r.categoryName || 'Uncategorized')}</span>
                  </div>
                );
              }},
              { key: 'description', label: 'Notes', render: (r) => (
                <div className="row-note">
                  <span>{r.description || '—'}</span>
                </div>
              )},
              { key: 'paymentMethod', label: 'Payment', render: (r) => (
                <div className="row-pay">
                  <span>{prettyMethod(r.paymentMethod)}</span>
                </div>
              )},
              { key: 'amount', label: 'Value', align: 'right', render: (r) => (
                <span className="row-amt">{sym}{parseFloat(r.amount).toFixed(2)}</span>
              )},
              { key: 'actions', label: '', width: '80px', render: (r) => (
                <div className="row-acts">
                  <button className="ract-btn" onClick={() => openEdit(r)} title="Edit"><FaEdit /></button>
                  <button className="ract-btn danger" onClick={() => handleDelete(r.id)} title="Delete"><FaTrash /></button>
                </div>
              )}
            ]}
            data={filtered}
            emptyTitle="No Transaction History"
          />
        )}
      </div>

      {showForm && (
        <div className="mdl-ov" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="mdl-box" onClick={e => e.stopPropagation()} style={{maxWidth:360}}>
            <div className="mdl-hdr">
              <h3 className="mdl-hdr-t">{editing ? 'Modify Transaction' : 'Record New Expense'}</h3>
              <button className="mdl-hdr-x" onClick={() => { setShowForm(false); setEditing(null); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mdl-body">
                <div className="mdl-field">
                  <label className="mdl-lbl">Occurrence Date</label>
                  <PremiumDateTimePicker 
                    value={`${fDate}T${fTime}`} 
                    onChange={val => {
                      setFDate(val.slice(0, 10));
                      setFTime(val.slice(11, 16));
                    }} 
                  />
                </div>

                <div className="mdl-field highlight">
                  <div className="lbl-row">
                    <label className="mdl-lbl">Classification</label>
                    <button type="button" className="new-tag" onClick={() => setShowCatMgr(true)}>+ New</button>
                  </div>
                  <NiceSelect 
                    value={fCatId} 
                    onChange={setFCatId} 
                    options={categories.filter(c => c.isActive === 'Y' || c.id === fCatId).map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Select category…"
                  />
                </div>

                <div className="mdl-field">
                  <label className="mdl-lbl">Transaction Amount</label>
                  <div className="amt-wrap">
                    <span className="amt-sym">{sym}</span>
                    <input type="number" min="0" step="0.01" className="amt-in" placeholder="0.00" value={fAmount} onChange={e => setFAmount(e.target.value)} required />
                  </div>
                </div>

                <div className="mdl-field">
                  <label className="mdl-lbl">Settlement Mode</label>
                  <div className="pay-grid">
                    {PAY_METHODS.map(pm => (
                      <button key={pm.value} type="button" className={`pay-opt ${fMethod === pm.value ? 'on' : ''}`} onClick={() => setFMethod(pm.value)}>
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mdl-field">
                  <label className="mdl-lbl">Contextual Notes</label>
                  <textarea rows={2} className="note-in" placeholder="Why was this spent? (Optional)" value={fDesc} onChange={e => setFDesc(e.target.value)} />
                </div>

                <div className="mdl-acts-row">
                  <button type="button" className="mdl-btn-discard" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                  <button type="submit" className="mdl-btn-confirm" disabled={saving}>{saving ? 'Processing…' : 'Complete'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatMgr && (
        <div className="mdl-ov" onClick={() => setShowCatMgr(false)}>
          <div className="mdl-box" onClick={e => e.stopPropagation()} style={{maxWidth:340, border:'1px solid #e2e8f0', borderTop:'3px solid #f97316'}}>
            <div className="mdl-hdr">
              <div className="mdl-hdr-l">
                <h3 className="mdl-hdr-t">Category Master</h3>
                <div className="mdl-hdr-flts">
                  <button type="button" className={`hdr-flt ${catActiveFilter === 'Y' ? 'on' : ''}`} onClick={() => setCatActiveFilter('Y')}>Active</button>
                  <button type="button" className={`hdr-flt ${catActiveFilter === 'N' ? 'on' : ''}`} onClick={() => setCatActiveFilter('N')}>Inactive</button>
                </div>
              </div>
              <button type="button" className="mdl-hdr-x" onClick={() => setShowCatMgr(false)}>✕</button>
            </div>
            <div className="mdl-body">
              <div className="cat-add-row">
                <input placeholder="New category label…" value={catName} onChange={e => setCatName(e.target.value)} className="cat-in"
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                />
                <button className="cat-add-btn" onClick={addCategory} disabled={catSaving}>Add</button>
              </div>
              <div className="cat-list">
                {categories.filter(c => c.isActive === catActiveFilter).map(c => (
                  <div key={c.id} className="cat-item">
                    <span className="cat-nm">{c.name}</span>
                    <button className={`cat-act-btn ${c.isActive === 'Y' ? 'deactivate' : 'restore'}`} 
                      onClick={() => toggleCatActive(c)}
                      title={c.isActive === 'Y' ? 'Mark Inactive' : 'Restore'}
                    >
                      {c.isActive === 'Y' ? <FaTrash /> : <FaUndo />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .exp-page{max-width:1200px;margin:0 auto}
        .exp-controls{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px}
        .exp-dates{display:flex;align-items:center;gap:6px}
        .exp-to{font-size:11px;color:#cbd5e1;font-weight:700}
        .exp-actions{display:flex;gap:4px}
        .exp-btn{padding:8px 14px;border-radius:10px;border:none;font:600 10px sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.2s}
        .exp-btn.primary{background:#f97316;color:#fff;box-shadow:0 4px 10px rgba(249,115,22,0.1)}
        .exp-btn.ghost{background:#fff;color:#94a3b8;border:1px solid #f1f5f9}
        .exp-btn:hover{transform:translateY(-1px)}
        
        .exp-kpis{display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px}
        .exp-kpi{background:#fff;border:1px solid #f1f5f9;border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 4px 20px rgba(15,23,42,0.02);transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);position:relative;overflow:hidden}
        .exp-kpi:hover{transform:translateY(-4px);box-shadow:0 12px 24px rgba(15,23,42,0.06);border-color:#e2e8f0}
        
        .kpi-hdr{display:flex;justify-content:space-between;align-items:flex-start}
        .kpi-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}
        
        .kpi-icon-circle{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px}
        .kpi-icon-circle.red{background:rgba(239,68,68,0.08);color:#ef4444}
        .kpi-icon-circle.blue{background:rgba(59,130,246,0.08);color:#3b82f6}
        .kpi-icon-circle.orange{background:rgba(249,115,22,0.08);color:#f97316}

        .kpi-body{display:flex;flex-direction:column;gap:2px}
        .kpi-value{font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px}
        .kpi-value.red-text{color:#ef4444}
        .kpi-value.orange-text{color:#f97316}
        .kpi-subtext{font-size:11px;font-weight:600;color:#94a3b8}

        .card-filter{background:#fffcf5;border-color:#fef3c7}
        .card-filter:hover{border-color:#fde68a}

        .exp-filter-row{display:flex;align-items:center;gap:6px;margin-bottom:12px}
        .exp-clear{background:none;border:none;color:#f97316;font-size:10px;font-weight:700;cursor:pointer;padding:0 8px}

        /* Table Row Styling */
        .row-date{display:flex;flex-direction:column;gap:1px}
        .rd-d{font-size:11px;font-weight:700;color:#1e293b}
        .rd-t{font-size:9px;font-weight:600;color:#94a3b8;opacity:0.8}
        
        .row-cat{display:flex;align-items:center;gap:6px}
        .rc-icon{font-size:8px;color:#f97316;opacity:0.4}
        .rc-text{font-size:10px;font-weight:700;color:#475569;background:#fcfdfe;padding:2px 8px;border-radius:6px;border:1px solid #f8fafc;text-transform:uppercase}
        
        .row-note{display:flex;align-items:center;gap:6px;font-size:10px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .rn-icon{font-size:9px;opacity:0.3}
        
        .row-pay{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:600;color:#94a3b8}
        .rp-icon{font-size:9px;opacity:0.4}
        
        .row-amt{font-size:13px;font-weight:800;color:#ef4444}
        
        .row-acts{display:flex;gap:4px;justify-content:flex-end}
        .ract-btn{width:28px;height:28px;border-radius:8px;border:1px solid #f1f5f9;background:#fff;color:#cbd5e1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;font-size:10px}
        .ract-btn:hover{background:#f8fafc;color:#1e293b;border-color:#cbd5e1}
        .ract-btn.danger:hover{color:#ef4444;border-color:#fecaca;background:#fef2f2}

        .exp-loading{text-align:center;padding:40px;font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:1px}

        /* Modal Redesign */
        .mdl-ov{position:fixed;inset:0;background:rgba(15,23,42,0.05);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
        .mdl-box{background:#fff;border-radius:24px;width:100%;overflow:hidden;box-shadow:0 30px 60px rgba(15,23,42,0.08);border:1px solid #e2e8f0;border-top:3px solid #f97316}
        .mdl-hdr{padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center}
        .mdl-hdr-t{font-weight:800;font-size:15px;color:#0f172a;margin:0;letter-spacing:-0.3px}
        .mdl-hdr-x{border:none;background:none;color:#cbd5e1;cursor:pointer;font-size:16px;transition:.2s}
        .mdl-hdr-x:hover{color:#ef4444;transform:rotate(90deg)}
        .mdl-body{padding:20px}
        .mdl-field{display:flex;flex-direction:column;margin-bottom:16px}
        .mdl-field.highlight{background:#fcfdfe;padding:12px;border-radius:12px;border:1px solid #f1f5f9}
        .mdl-lbl{font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
        .lbl-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
        .new-tag{font-size:8px;font-weight:800;color:#f97316;border:1px solid rgba(249,115,22,0.15);background:#fff;border-radius:6px;padding:2px 8px;cursor:pointer;transition:.2s;box-shadow:0 2px 4px rgba(249,115,22,0.04)}
        .new-tag:hover{background:#f97316;color:#fff;border-color:#f97316}
        
        .amt-wrap{position:relative;display:flex;align-items:center}
        .amt-sym{position:absolute;left:14px;font-size:14px;font-weight:800;color:#f97316}
        .amt-in{font-size:18px;padding:12px 12px 12px 34px;color:#0f172a;font-weight:800;border:1px solid #e2e8f0;border-radius:12px;background:#fff;width:100%;outline:none;transition:.2s}
        .amt-in:focus{border-color:#f97316;box-shadow:0 0 0 4px rgba(249,115,22,0.08)}
        
        .note-in{width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:12px;font-size:12px;font-weight:500;resize:none;color:#475569;background:#fff;outline:none;transition:.2s}
        .note-in:focus{border-color:#94a3b8}
        
        .pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .pay-opt{padding:10px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font:700 10px sans-serif;color:#64748b;text-align:center;transition:.2s}
        .pay-opt.on{border-color:#f97316;background:rgba(249,115,22,0.04);color:#f97316;box-shadow:0 4px 12px rgba(249,115,22,0.08)}
        .pay-opt:hover:not(.on){border-color:#cbd5e1;color:#334155;background:#f8fafc}

        .mdl-acts-row{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
        .mdl-btn-discard{flex:1;padding:12px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font:700 11px sans-serif;cursor:pointer;transition:.2s}
        .mdl-btn-discard:hover{border-color:#cbd5e1;color:#1e293b;background:#f8fafc}
        .mdl-btn-confirm{flex:2;padding:12px;border-radius:12px;border:1px solid #ea580c;background:#f97316;color:#fff;font:700 11px sans-serif;cursor:pointer;transition:.2s;box-shadow:0 8px 16px rgba(249,115,22,0.15)}
        .mdl-btn-confirm:hover{background:#ea580c;transform:translateY(-1.5px);box-shadow:0 10px 20px rgba(249,115,22,0.2)}
        .mdl-btn-confirm:disabled{opacity:0.6;cursor:not-allowed;transform:none}
        
        .cat-add-row{display:flex;gap:8px;margin-bottom:16px}
        .cat-in{flex:1;padding:12px 16px;border:1px solid #e2e8f0;border-radius:12px;font-size:13px;font-weight:600;outline:none}
        .cat-add-btn{padding:0 20px;border-radius:12px;background:#f97316;color:#fff;font-weight:700;font-size:12px;border:none;cursor:pointer;transition:.2s}
        .cat-add-btn:hover{background:#ea580c}
        .cat-list{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto;padding-right:4px}
        .cat-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9}
        .cat-nm{font-size:13px;font-weight:700;color:#334155}
        .cat-act-btn{width:28px;height:28px;border-radius:8px;border:1px solid #f1f5f9;background:#fff;color:#cbd5e1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;font-size:10px}
        .cat-act-btn.deactivate:hover{color:#ef4444;border-color:#fecaca;background:#fef2f2}
        .cat-act-btn.restore:hover{color:#22c55e;border-color:#bbf7d0;background:#f0fdf4}

        .mdl-hdr-l{display:flex;align-items:center;gap:12px}
        .mdl-hdr-flts{display:flex;background:#f1f5f9;padding:2px;border-radius:8px}
        .hdr-flt{border:none;background:none;padding:4px 10px;font:700 9px sans-serif;color:#94a3b8;cursor:pointer;border-radius:6px;transition:.2s}
        .hdr-flt.on{background:#fff;color:#f97316;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
      `}</style>
    </DashboardLayout>
  );
}
