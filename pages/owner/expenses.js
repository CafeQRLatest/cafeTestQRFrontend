import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ReportTable from '../../components/ReportTable';
import api from '../../utils/api';
import { FaPlus, FaTimes, FaTrash, FaEdit, FaRedo, FaCog } from 'react-icons/fa';

const PAY_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'online', label: 'Online' },
  { value: 'credit', label: 'Credit' },
  { value: 'none', label: 'None / Other' }
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10));

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fDate, setFDate] = useState('');
  const [fTime, setFTime] = useState('');
  const [fCatId, setFCatId] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fMethod, setFMethod] = useState('');
  const [saving, setSaving] = useState(false);

  // Category manager
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);

  const showToast = (msg, type) => {
    // Simple implementation - could be replaced with a toast library
    if (type === 'error') console.error(msg);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, expRes] = await Promise.all([
        api.get('/api/v1/expenses/categories'),
        api.get('/api/v1/expenses', { params: {
          start: `${dateFrom}T00:00:00`,
          end: `${dateTo}T23:59:59`
        }})
      ]);
      if (catRes.data.success) setCategories(catRes.data.data || []);
      if (expRes.data.success) setExpenses(expRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [dateFrom, dateTo]);

  // Filtered
  const filtered = useMemo(() => {
    if (!filterCat) return expenses;
    return expenses.filter(e => e.categoryId === filterCat);
  }, [expenses, filterCat]);

  const totalVisible = useMemo(() => filtered.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0), [filtered]);
  const totalAll = useMemo(() => expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0), [expenses]);

  // Form helpers
  const openAdd = () => {
    setEditing(null);
    const now = new Date();
    setFDate(now.toISOString().slice(0,10));
    setFTime(now.toTimeString().slice(0,5));
    setFCatId(''); setFAmount(''); setFDesc(''); setFMethod('');
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    const d = new Date(exp.expenseDate);
    setFDate(d.toISOString().slice(0,10));
    setFTime(d.toTimeString().slice(0,5));
    setFCatId(exp.categoryId || '');
    setFAmount(String(exp.amount || ''));
    setFMethod(exp.paymentMethod || '');
    setFDesc(exp.description || '');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fAmount || parseFloat(fAmount) <= 0) return alert('Enter a valid amount');
    if (!fCatId) return alert('Select a category');
    if (!fMethod) return alert('Select a payment method');
    setSaving(true);
    try {
      const payload = {
        categoryId: fCatId,
        expenseDate: `${fDate}T${fTime}:00`,
        amount: parseFloat(fAmount),
        description: fDesc || null,
        paymentMethod: fMethod
      };
      if (editing) {
        await api.put(`/api/v1/expenses/${editing.id}`, payload);
      } else {
        await api.post('/api/v1/expenses', payload);
      }
      setShowForm(false); setEditing(null);
      await loadData();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/expenses/${deleteId}`);
      setDeleteId(null);
      await loadData();
    } catch (err) { alert('Failed to delete'); }
  };

  // Category CRUD
  const addCategory = async () => {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      await api.post('/api/v1/expenses/categories', { name: catName.trim(), sortOrder: 99 });
      setCatName('');
      await loadData();
    } catch (e) { alert('Failed'); }
    finally { setCatSaving(false); }
  };

  const saveEditCat = async () => {
    if (!editCatId || !editCatName.trim()) return;
    try {
      await api.put(`/api/v1/expenses/categories/${editCatId}`, { name: editCatName.trim() });
      setEditCatId(null); setEditCatName('');
      await loadData();
    } catch (e) { alert('Failed'); }
  };

  const deleteCat = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/api/v1/expenses/categories/${id}`);
      await loadData();
    } catch (e) { alert(e.response?.data?.message || 'Cannot delete'); }
  };

  const prettyMethod = (m) => {
    if (!m || m === 'none') return 'None';
    return m.charAt(0).toUpperCase() + m.slice(1);
  };

  const sym = '₹';

  return (
    <DashboardLayout title="Expenses">
      <div className="exp-page">
        {/* Controls */}
        <div className="exp-controls">
          <div className="exp-dates">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="exp-input" />
            <span className="exp-to">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="exp-input" />
          </div>
          <div className="exp-actions">
            <button className="exp-btn primary" onClick={openAdd}><FaPlus style={{fontSize:10}}/> Expense</button>
            <button className="exp-btn ghost" onClick={() => setShowCatMgr(true)}><FaCog style={{fontSize:10}}/> Categories</button>
            <button className="exp-btn ghost" onClick={loadData}><FaRedo style={{fontSize:10}}/></button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="exp-kpis">
          <div className="exp-kpi">
            <span className="kpi-label">Total Expenses</span>
            <span className="kpi-value red">{sym}{totalAll.toFixed(2)}</span>
          </div>
          <div className="exp-kpi">
            <span className="kpi-label">Entries</span>
            <span className="kpi-value">{expenses.length}</span>
          </div>
          {filterCat && (
            <div className="exp-kpi">
              <span className="kpi-label">Filtered Total</span>
              <span className="kpi-value orange">{sym}{totalVisible.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Filter row */}
        <div className="exp-filter-row">
          <select className="exp-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {filterCat && <button className="exp-clear" onClick={() => setFilterCat('')}><FaTimes/></button>}
        </div>

        {/* Table */}
        {loading ? (
          <div className="exp-loading">Loading…</div>
        ) : (
          <ReportTable
            accentColor="#f97316"
            columns={[
              { key: 'expenseDate', label: 'Date', render: (r) => (
                <div style={{display:'flex', flexDirection:'column'}}>
                  <span style={{fontWeight:700, fontSize:'12px'}}>{new Date(r.expenseDate).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</span>
                  <span style={{fontSize:'10px', opacity:0.5}}>{new Date(r.expenseDate).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', hour12:true})}</span>
                </div>
              )},
              { key: 'categoryName', label: 'Category', render: (r) => (
                <span className="exp-cat-badge">{r.categoryName || 'Uncategorized'}</span>
              )},
              { key: 'description', label: 'Note', render: (r) => (
                <span style={{fontSize:'12px', color:'#64748b'}}>{r.description || '—'}</span>
              )},
              { key: 'paymentMethod', label: 'Pay', render: (r) => (
                <span className="exp-pay-badge">{prettyMethod(r.paymentMethod)}</span>
              )},
              { key: 'amount', label: 'Amount', align: 'right', render: (r) => (
                <span style={{fontWeight:900, color:'#dc2626', fontSize:'13px'}}>{sym}{parseFloat(r.amount).toFixed(2)}</span>
              )},
              { key: 'actions', label: '', width: '80px', render: (r) => (
                <div style={{display:'flex', gap:'4px'}}>
                  <button className="exp-icon-btn" onClick={() => openEdit(r)}><FaEdit/></button>
                  <button className="exp-icon-btn danger" onClick={() => setDeleteId(r.id)}><FaTrash/></button>
                </div>
              )}
            ]}
            data={filtered}
            emptyTitle="No expenses recorded"
            emptyText="Add your first expense using the button above."
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="mdl-ov" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="mdl-box" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
            <div className="mdl-hdr" style={{background:'rgba(249,115,22,0.05)', color:'#f97316'}}>
              <div className="mdl-hdr-info">
                <h3 className="mdl-hdr-t">{editing ? 'Edit Expense' : 'Add Expense'}</h3>
                <span className="mdl-hdr-sub">RECORD BUSINESS EXPENDITURE</span>
              </div>
              <button className="mdl-hdr-x" onClick={() => { setShowForm(false); setEditing(null); }}><FaTimes/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mdl-body">
                <div className="mdl-field-row">
                  <div className="mdl-field"><label>📅 Date</label><input type="date" value={fDate} onChange={e => setFDate(e.target.value)} required/></div>
                  <div className="mdl-field"><label>🕐 Time</label><input type="time" value={fTime} onChange={e => setFTime(e.target.value)} required/></div>
                </div>
                <div className="mdl-field">
                  <label>📂 Category</label>
                  <select value={fCatId} onChange={e => setFCatId(e.target.value)} required style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontSize:'13px',fontWeight:600}}>
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mdl-field"><label>💰 Amount ({sym})</label><input type="number" min="0" step="0.01" placeholder="0.00" value={fAmount} onChange={e => setFAmount(e.target.value)} required/></div>
                <div className="mdl-field">
                  <label>💳 Payment Method</label>
                  <div className="pay-grid">
                    {PAY_METHODS.map(pm => (
                      <button key={pm.value} type="button" className={`pay-opt ${fMethod === pm.value ? 'on' : ''}`} style={{'--pc':'#f97316'}} onClick={() => setFMethod(pm.value)}><span>{pm.label}</span></button>
                    ))}
                  </div>
                </div>
                <div className="mdl-field"><label>📝 Note</label><textarea rows={2} placeholder="Optional description…" value={fDesc} onChange={e => setFDesc(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontSize:'13px',resize:'vertical',fontFamily:'inherit'}}/></div>
                <div className="mdl-acts-row">
                  <button type="button" className="mdl-btn-discard" onClick={() => { setShowForm(false); setEditing(null); }}>Discard</button>
                  <button type="submit" className="mdl-btn-confirm" style={{background:'#f97316'}} disabled={saving}>{saving ? 'Saving…' : 'Confirm & Save'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="mdl-ov" onClick={() => setDeleteId(null)}>
          <div className="mdl-box" onClick={e => e.stopPropagation()} style={{maxWidth:340}}>
            <div className="mdl-body" style={{textAlign:'center', padding:'32px 24px'}}>
              <div style={{fontSize:'40px', marginBottom:'12px'}}>🗑️</div>
              <h3 style={{margin:'0 0 8px', fontSize:'16px', fontWeight:900}}>Delete Expense?</h3>
              <p style={{fontSize:'12px', color:'#64748b', margin:'0 0 20px'}}>This action cannot be undone.</p>
              <div className="mdl-acts-row">
                <button className="mdl-btn-discard" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="mdl-btn-confirm" style={{background:'#ef4444'}} onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCatMgr && (
        <div className="mdl-ov" onClick={() => setShowCatMgr(false)}>
          <div className="mdl-box" onClick={e => e.stopPropagation()} style={{maxWidth:400}}>
            <div className="mdl-hdr" style={{background:'rgba(249,115,22,0.05)', color:'#f97316'}}>
              <div className="mdl-hdr-info">
                <h3 className="mdl-hdr-t">Manage Categories</h3>
                <span className="mdl-hdr-sub">ADD, EDIT & REMOVE</span>
              </div>
              <button className="mdl-hdr-x" onClick={() => setShowCatMgr(false)}><FaTimes/></button>
            </div>
            <div className="mdl-body">
              <div style={{display:'flex', gap:'8px'}}>
                <input placeholder="New category name…" value={catName} onChange={e => setCatName(e.target.value)} style={{flex:1, padding:'10px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', fontWeight:600}}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                />
                <button className="exp-btn primary" onClick={addCategory} disabled={catSaving}><FaPlus/></button>
              </div>
              <div className="cat-list">
                {categories.length === 0 && <div style={{textAlign:'center', padding:'20px', fontSize:'12px', color:'#94a3b8'}}>No categories yet</div>}
                {categories.map(c => (
                  <div key={c.id} className="cat-item">
                    {editCatId === c.id ? (
                      <div style={{display:'flex', gap:'6px', flex:1}}>
                        <input value={editCatName} onChange={e => setEditCatName(e.target.value)} style={{flex:1, padding:'6px 10px', border:'1.5px solid #f97316', borderRadius:'8px', fontSize:'12px'}}
                          onKeyDown={e => e.key === 'Enter' && saveEditCat()}
                        />
                        <button className="exp-icon-btn" onClick={saveEditCat}>✓</button>
                        <button className="exp-icon-btn" onClick={() => setEditCatId(null)}>✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="cat-nm">{c.name}</span>
                        <div style={{display:'flex', gap:'4px'}}>
                          <button className="exp-icon-btn" onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }}><FaEdit/></button>
                          <button className="exp-icon-btn danger" onClick={() => deleteCat(c.id)}><FaTrash/></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .exp-page{max-width:1200px;margin:0 auto}
        .exp-controls{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px}
        .exp-dates{display:flex;align-items:center;gap:8px}
        .exp-to{font-size:12px;color:#94a3b8;font-weight:700}
        .exp-input{padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:10px;font:600 12px 'Plus Jakarta Sans',sans-serif;color:#334155;background:#fff;transition:.2s}
        .exp-input:focus{border-color:#f97316;outline:none;box-shadow:0 0 0 3px rgba(249,115,22,0.1)}
        .exp-actions{display:flex;gap:6px}
        .exp-btn{padding:8px 14px;border-radius:10px;border:none;font:700 11px 'Plus Jakarta Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.2s}
        .exp-btn.primary{background:#f97316;color:#fff;box-shadow:0 4px 12px rgba(249,115,22,0.25)}
        .exp-btn.primary:hover{background:#ea580c;transform:translateY(-1px)}
        .exp-btn.ghost{background:#fff;color:#64748b;border:1.5px solid #e2e8f0}
        .exp-btn.ghost:hover{border-color:#f97316;color:#f97316}
        .exp-kpis{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
        .exp-kpi{background:#fff;border:1.5px solid #f1f5f9;border-radius:12px;padding:14px 20px;display:flex;flex-direction:column;gap:2px;min-width:140px}
        .kpi-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
        .kpi-value{font-size:18px;font-weight:900;color:#0f172a}
        .kpi-value.red{color:#dc2626}
        .kpi-value.orange{color:#f97316}
        .exp-filter-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}
        .exp-select{padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:10px;font:600 12px 'Plus Jakarta Sans',sans-serif;color:#334155;background:#fff;min-width:180px}
        .exp-select:focus{border-color:#f97316;outline:none}
        .exp-clear{width:28px;height:28px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;transition:.2s}
        .exp-clear:hover{border-color:#ef4444;color:#ef4444}
        .exp-cat-badge{font-size:10px;font-weight:800;padding:3px 8px;border-radius:6px;background:#fff7ed;color:#f97316;text-transform:uppercase}
        .exp-pay-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;background:#f1f5f9;color:#475569}
        .exp-icon-btn{width:28px;height:28px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;transition:.2s}
        .exp-icon-btn:hover{border-color:#f97316;color:#f97316;transform:scale(1.05)}
        .exp-icon-btn.danger:hover{border-color:#ef4444;color:#ef4444}
        .exp-loading{text-align:center;padding:40px;font-size:13px;color:#94a3b8;font-weight:700}
        .cat-list{display:flex;flex-direction:column;gap:4px;margin-top:12px;max-height:300px;overflow-y:auto}
        .cat-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9}
        .cat-nm{font-size:13px;font-weight:700;color:#334155}
        .mdl-ov{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
        .mdl-box{background:#fff;border-radius:20px;width:100%;overflow:hidden;position:relative;animation:vmSlide .3s cubic-bezier(0.16,1,0.3,1);box-shadow:0 30px 60px rgba(0,0,0,0.12)}
        .mdl-hdr{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .mdl-hdr-info{display:flex;flex-direction:column;gap:2px}
        .mdl-hdr-t{margin:0;font-size:17px;font-weight:900;color:inherit}
        .mdl-hdr-sub{font-size:9px;font-weight:800;letter-spacing:.5px;opacity:.6;text-transform:uppercase;color:inherit}
        .mdl-hdr-x{width:28px;height:28px;border-radius:8px;border:none;background:rgba(0,0,0,.05);color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s}
        .mdl-hdr-x:hover{background:rgba(0,0,0,.1);transform:rotate(90deg)}
        .mdl-body{padding:20px;display:flex;flex-direction:column;gap:14px;background:#fff}
        .mdl-field{display:flex;flex-direction:column;gap:4px}
        .mdl-field label{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase}
        .mdl-field input,.mdl-field select{padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:10px;font:600 13px 'Plus Jakarta Sans',sans-serif;transition:.2s}
        .mdl-field input:focus,.mdl-field select:focus{border-color:#f97316;outline:none;box-shadow:0 0 0 3px rgba(249,115,22,.1)}
        .mdl-field-row{display:flex;gap:12px}
        .mdl-field-row .mdl-field{flex:1}
        .mdl-acts-row{display:flex;gap:10px;margin-top:4px}
        .mdl-btn-discard{flex:1;padding:12px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:.2s}
        .mdl-btn-discard:hover{border-color:#ef4444;color:#ef4444}
        .mdl-btn-confirm{flex:2;padding:12px;border-radius:10px;border:none;background:#f97316;color:#fff;font:800 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:.2s;box-shadow:0 4px 12px rgba(249,115,22,.3)}
        .mdl-btn-confirm:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(249,115,22,.35)}
        .mdl-btn-confirm:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .pay-opt{padding:10px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font:700 12px 'Plus Jakarta Sans',sans-serif;color:#64748b;transition:.2s;text-align:center}
        .pay-opt.on{border-color:var(--pc);background:rgba(249,115,22,.05);color:var(--pc);box-shadow:0 4px 12px rgba(249,115,22,.15)}
        .pay-opt:hover{border-color:var(--pc);color:var(--pc)}
        @keyframes vmSlide{from{opacity:0;transform:translateY(30px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @media(max-width:640px){
          .exp-controls{flex-direction:column;align-items:stretch}
          .exp-kpis{flex-direction:column}
          .exp-kpi{min-width:unset}
        }
      `}</style>
    </DashboardLayout>
  );
}
