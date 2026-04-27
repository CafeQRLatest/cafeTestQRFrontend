import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import PremiumDateTimePicker from '../../components/PremiumDateTimePicker';
import api from '../../utils/api';
import { 
  FaSearch, FaShoppingCart, FaPlus, FaMinus, FaTrash, FaArrowLeft, FaRedo, FaCheck, FaTimes, 
  FaUtensils, FaShoppingBag, FaMotorcycle, FaChair, FaUser, FaUsers, FaWallet, FaFire,
  FaCubes, FaUserPlus, FaBoxOpen, FaChevronUp, FaChevronDown, FaReceipt, FaCreditCard, FaCashRegister,
  FaExpand, FaCompress, FaExclamationCircle, FaEdit, FaClock
} from 'react-icons/fa';
import { calculateOrderTotals } from '../../utils/orderCalculations';
import ReportTable from '../../components/ReportTable';
import { useAuth } from '../../context/AuthContext';
import { buildReceiptText, parseDate } from '../../utils/printUtils';
import { printUniversal } from '../../utils/printGateway';

const FULFILLMENT = [
  { key: 'DINE_IN',  label: 'Dine In',  icon: <FaUtensils/>,  color: '#f97316' },
  { key: 'TAKEAWAY', label: 'Takeaway', icon: <FaShoppingBag/>, color: '#16a34a' },
  { key: 'DELIVERY', label: 'Delivery', icon: <FaMotorcycle/>, color: '#0ea5e9' }
];

export default function Sales() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingOrderNo, setEditingOrderNo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeCat, setActiveCat] = useState('ALL');
  const [activeFloor, setActiveFloor] = useState('ALL');
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [fulfillmentType, setFulfillmentType] = useState('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [phase, setPhase] = useState('table');
  const [orderMode, setOrderMode] = useState('settle');
  const [paymentMode, setPaymentMode] = useState('settle');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [settledAmount, setSettledAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [opMode, setOpMode] = useState('pos'); // pos, kitchen, tables, history
  const [orderTime, setOrderTime] = useState(new Date().toISOString().slice(0, 16));
  const [isFS, setIsFS] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const themeColor = (opMode === 'kitchen' || (opMode === 'pos' && orderMode === 'kitchen')) ? '#f97316' : (opMode === 'pos' && orderMode === 'credit') ? '#6366f1' : '#16a34a';
  const themeRGB = (opMode === 'kitchen' || (opMode === 'pos' && orderMode === 'kitchen')) ? '249, 115, 22' : (opMode === 'pos' && orderMode === 'credit') ? '99, 102, 241' : '22, 163, 74';

  // Modals
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showQuickProduct, setShowQuickProduct] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrderData, setEditingOrderData] = useState(null);

  // New Cust/Prod states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [custSaving, setCustSaving] = useState(false);
  const [qpName, setQpName] = useState('');
  const [qpPrice, setQpPrice] = useState('');
  const [qpCat, setQpCat] = useState('');
  const [qpCode, setQpCode] = useState('');
  const [qpTax, setQpTax] = useState('');
  const [qpVeg, setQpVeg] = useState(true);
  const [qpPkg, setQpPkg] = useState(false);
  const [qpSaving, setQpSaving] = useState(false);
  const [discount, setDiscount] = useState({ type: 'amount', value: 0 });
  const [discountTab, setDiscountTab] = useState('order'); // 'order' | 'line'
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableActions, setShowTableActions] = useState(false);
  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [kitchenFilter, setKitchenFilter] = useState('TAKEAWAY'); // TAKEAWAY, DELIVERY
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const searchRef = useRef(null);
  const custZoneRef = useRef(null);
  const prodZoneRef = useRef(null);
  const [showProdSuggestions, setShowProdSuggestions] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (custZoneRef.current && !custZoneRef.current.contains(event.target)) setShowSuggestions(false);
      if (prodZoneRef.current && !prodZoneRef.current.contains(event.target)) setShowProdSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [p, t, c, cfg] = await Promise.all([
          api.get('/api/v1/products'),
          api.get('/api/v1/tables'),
          api.get('/api/v1/purchasing/customers'),
          api.get('/api/v1/configurations')
        ]);
        setProducts(p.data.data || []);
        setTables(t.data.data || []);
        setCustomers(c.data.data || []);
        const cfgD = cfg.data.data;
        setConfig(cfgD);
        
        const tableMgmt = !!cfgD?.tableManagementEnabled;
        setPhase(tableMgmt ? 'table' : 'pos');
        setFulfillmentType(tableMgmt ? 'DINE_IN' : 'TAKEAWAY');
        if(cfgD?.sendToKitchenEnabled) setOrderMode('kitchen');
      } catch { 
        showToast('Failed to load data', 'error'); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, []);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const statuses = opMode === 'history' ? 'COMPLETED,PAID' : 'KITCHEN,CONFIRMED';
      const r = await api.get(`/api/v1/orders?status=${statuses}`);
      setAllOrders(r.data.data || []);
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadOrderForEdit = async (orderId) => {
    try {
      showToast('Loading Order...');
      const { data: { data: order } } = await api.get(`/api/v1/orders/${orderId}`);
      if (!order) return;
      
      setFulfillmentType(order.fulfillmentType);
      setTableNumber(order.tableNumber || '');
      setOrderTime(new Date(order.orderDate).toISOString().slice(0, 16));
      
      const mappedCart = order.lines.map(l => ({
        pid: l.productId,
        name: l.productName,
        price: l.unitPrice,
        qty: l.quantity,
        tax: l.taxRate,
        uom: l.unitOfMeasure,
        lineDiscount: l.discountAmount || 0,
        is_packaged: l.isPackagedGood
      }));
      
      console.log('Order Data Loaded:', order);
      setCart(mappedCart);
      setDiscount({ type: 'amount', value: order.totalDiscountAmount || 0 });
      setEditingOrderId(order.id);
      setEditingOrderNo(order.orderNo);
      setEditingOrderData({ ...order, lines: mappedCart, originalLines: JSON.parse(JSON.stringify(mappedCart)) });
      setShowEditModal(true);
      console.log('Modal State Set to True');
      showToast('Order Ready for Review');
    } catch (e) {
      console.error('Load Order Error:', e);
      showToast(`Load Failed: ${e.response?.data?.message || e.message}`, 'error');
    }
  };

  useEffect(() => {
    if (opMode === 'kitchen' || opMode === 'tables' || opMode === 'history') {
      fetchOrders();
      if (opMode !== 'history') {
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [opMode]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const tableOn    = config?.tableManagementEnabled === true;
  const imagesOn   = config?.menuImagesEnabled === true;
  const taxOn      = config?.taxEnabled === true;
  const taxSplitOn = config?.taxSplitEnabled === true;
  const listingOn  = config?.posProductListingEnabled !== false;
  const discountOn = config?.discountEnabled !== false;
  const kitchenOn  = config?.sendToKitchenEnabled === true;
  const creditOn   = config?.creditEnabled === true;
  const customerOn = config?.customersEnabled === true;
  const roundOn    = config?.roundOffEnabled === true;
  const pricesInclTax = config?.pricesIncludeTax === true;
  const roundMode  = config?.roundOffMode || 'automatic';
  const roundFactor= parseFloat(config?.roundOffAutoFactor) || 1;
  const roundLimit = parseFloat(config?.roundOffManualLimit) || 10;
  const sym        = config?.currencySymbol || '₹';

  const defaultTaxRate = useMemo(() => {
    if (!taxOn) return 0;
    const rates = config?.taxRates || [];
    const def = config?.taxDefaultId;
    const f = rates.find(r => r.id === def);
    return f ? parseFloat(f.value) || 0 : (rates[0] ? parseFloat(rates[0].value) || 0 : 0);
  }, [config, taxOn]);
  const taxLabel = config?.taxLabelGlobal || 'Tax';

  const THEME = orderMode === 'kitchen' 
    ? { main: '#f97316', dark: '#ea580c', soft: '#fff7ed', rgb: '249,115,22' }
    : orderMode === 'credit'
    ? { main: '#6366f1', dark: '#4f46e5', soft: '#e0e7ff', rgb: '99,102,241' }
    : { main: '#16a34a', dark: '#15803d', soft: '#ecfdf3', rgb: '22,163,74' };

  const addToCart = useCallback(product => {
    setCart(prev => {
      const ex = prev.find(c => c.pid === product.id);
      if (ex) return prev.map(c => c.pid === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, {
        pid: product.id, name: product.name, price: parseFloat(product.price) || 0,
        tax: parseFloat(product.taxRate) || defaultTaxRate, img: product.imageUrl || '',
        uom: product.uomName || 'units', qty: 1, lineDiscount: 0,
        is_packaged: product.isPackagedGood === true
      }];
    });
  }, [defaultTaxRate]);

  const updQty = (pid, d) => setCart(p => p.map(c => c.pid !== pid ? c : { ...c, qty: Math.max(1, c.qty + d) }));
  const delItem = pid => setCart(p => p.filter(c => c.pid !== pid));
  const clearCart = () => { setCart([]); setDiscount({ type: 'amount', value: 0 }); setSelectedCustomers([]); };

  useEffect(() => {
    const h = e => {
      if (phase !== 'pos') return;
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setSearch(''); searchRef.current?.blur(); setMobileCart(false); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [phase]);

  const totals = useMemo(() => {
    return calculateOrderTotals(
      cart.map(c => ({ 
        ...c, 
        quantity: c.qty, 
        price: c.price, 
        tax_rate: c.tax, 
        is_packaged: c.is_packaged
      })),
      discount,
      {
        gst_enabled: taxOn,
        default_tax_rate: defaultTaxRate,
        prices_include_tax: pricesInclTax,
        round_off_config: {
          round_off_enabled: roundOn,
          round_off_mode: roundMode,
          round_off_auto_factor: roundFactor
        }
      }
    );
  }, [cart, discount, taxOn, defaultTaxRate, pricesInclTax, roundOn, roundMode, roundFactor]);

  const { 
    total_amount: total, 
    taxable_amount: taxable, 
    total_tax: tax, 
    discount_amount: discountAmt, 
    total_inc_tax: totalBeforeRound, 
    round_off_amount: autoRoundOff, 
    gross_face_total: sub,
    subtotal_base_ex_tax: subEx,
    line_subtotal: grossInc
  } = totals;

  const initiateOrder = (mode) => {
    if (!cart.length) { showToast('Cart is empty', 'error'); return; }
    setPaymentMode(mode);
    setSettledAmount(+(total).toFixed(2));
    setShowPaymentDialog(true);
  };

  const placeOrder = async (mode = 'settle', method = 'cash', roundOff = 0) => {
    setSaving(true);
    try {
      // Use the centralized calculation engine output for perfect UI ↔ Backend parity
      const processedItems = totals.processed_items || [];
      const payload = {
        orderNo: editingOrderNo || `SO-${Date.now().toString().slice(-8)}`,
        orderType: 'SALE',
        orderStatus: mode === 'kitchen' ? 'KITCHEN' : 'COMPLETED',
        paymentStatus: mode === 'credit' ? 'PAID' : (mode === 'kitchen' ? 'PENDING' : 'PAID'), // Simplified logic
        orderSource: 'OFFLINE', fulfillmentType: fulfillmentType || 'TAKEAWAY',
        tableNumber: tableNumber || null, orderDate: orderTime,
        customerId: selectedCustomers[0]?.id || null,
        totalAmount: +totals.total_inc_tax.toFixed(2),
        totalTaxAmount: +totals.total_tax.toFixed(2),
        totalDiscountAmount: +totals.discount_amount.toFixed(2),
        grandTotal: +((mode === 'settle' || mode === 'credit') ? settledAmount : totals.total_amount).toFixed(2),
        description: method !== 'none' ? `Payment: ${method}` : null,
        lines: processedItems.map(pi => {
          const cartItem = cart.find(c => c.pid === pi.pid || c.name === pi.item_name);
          return {
            productId: cartItem?.pid || pi.pid || null,
            quantity: pi.quantity,
            unitPrice: pi.unit_price,
            unitOfMeasure: cartItem?.uom || pi.unitOfMeasure || 'units',
            taxRate: +pi.tax_rate.toFixed(2),
            taxAmount: +pi.tax_amount.toFixed(2),
            discountAmount: +pi.discount_amount.toFixed(2),
            lineTotal: +pi.line_total.toFixed(2)
          };
        }),
      };

      let r;
      if (editingOrderId) {
        r = await api.put(`/api/v1/orders/${editingOrderId}`, payload);
      } else {
        r = await api.post('/api/v1/orders', payload);
      }

      if (r.data.success) {
        showToast(editingOrderId ? 'Order Updated!' : (mode === 'kitchen' ? 'Sent to Kitchen!' : 'Order Placed!'));
        newOrder(); 
        setShowPaymentDialog(false);
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createCustomer = async () => {
    if (!customerName.trim()) return;
    setCustSaving(true);
    try {
      const r = await api.post('/api/v1/purchasing/customers', { name: customerName, phone: customerPhone });
      if (r.data.success) {
        setCustomers(p => [r.data.data, ...p]);
        setSelectedCustomers(p => [...p, r.data.data]);
        setShowNewCustomer(false);
        showToast('Customer created!');
      }
    } catch (e) { showToast('Failed to create customer', 'error'); }
    finally { setCustSaving(false); }
  };

  const createQuickProduct = async () => {
    if (!qpName.trim() || !qpPrice) return;
    setQpSaving(true);
    try {
      const payload = {
        name: qpName,
        price: parseFloat(qpPrice),
        categoryName: qpCat || 'Quick Add',
        productCode: qpCode,
        taxRate: parseFloat(qpTax) || 0,
        isPackagedGood: qpPkg,
        isActive: true
      };
      const r = await api.post('/api/v1/products', payload);
      if (r.data.success) {
        const p = r.data.data;
        setProducts(prev => [p, ...prev]);
        setCart(prev => [{ 
          pid: p.id, name: p.name, price: p.price, qty: 1, 
          tax: p.taxRate || 0, uom: p.uomName || 'units',
          is_packaged: p.isPackagedGood === true
        }, ...prev]);
        setShowQuickProduct(false);
        showToast('Product added to menu & cart!');
      }
    } catch (e) { showToast('Failed to create product', 'error'); }
    finally { setQpSaving(false); }
  };

  const pickTable = async t => { 
    if (opMode === 'tables') {
      setSelectedTable(t);
      setShowTableActions(true);
      setActiveOrderDetails(null);
      const activeOrder = allOrders.find(o => o.tableNumber === t.tableNumber && o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED');
      if (activeOrder) {
        setDetailsLoading(true);
        try {
          const r = await api.get(`/api/v1/orders/${activeOrder.id}`);
          setActiveOrderDetails(r.data.data);
        } catch (e) { console.error(e); }
        finally { setDetailsLoading(false); }
      }
    } else {
      setTableNumber(t.tableNumber); 
      setPhase('pos'); 
    }
  };
  const newOrder = () => { 
    clearCart(); 
    setTableNumber(''); 
    setEditingOrderId(null);
    setEditingOrderNo(null);
    setPhase(tableOn ? 'table' : 'pos'); 
  };

  const toggleFS = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFS(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFS(false);
      }
    }
  };



  const catNames = useMemo(() => ['ALL', ...new Set(products.map(p => p.categoryName).filter(Boolean))], [products]);

  if (loading) return (
    <DashboardLayout title="Sales" showBack>
      <div className="sl"><div className="sp"/><span>Loading POS…</span>
      <style jsx>{`.sl{display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;color:#94a3b8;font-weight:700}.sp{width:38px;height:38px;border:4px solid #f1f5f9;border-top-color:#f97316;border-radius:50%;animation:sp .7s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Sales" showBack noSidebar={true}>
      <div className="pos-container" style={{ '--theme': themeColor, '--rgb': themeRGB }}>
        <header className="pos-hdr">
          <div className="pos-hdr-l">
            <button className="ctx-bk" onClick={() => router.back()} title="Go Back"><FaArrowLeft/></button>
            
            {opMode === 'pos' && (
              <div className="pos-hdr-controls">
                <div className="hdr-context-group">
                  <div className="pos-modes single">
                    {(() => {
                      const f = FULFILLMENT.find(x => x.key === fulfillmentType) || FULFILLMENT[0];
                      return (
                        <button className="mode-btn active" onClick={() => setPhase('table')} style={{ '--theme': f.color }}>
                          <span className="mode-ic">{f.icon}</span>
                          <span className="mode-lb">{f.label} {tableNumber && `(#${tableNumber})`}</span>
                        </button>
                      );
                    })()}
                  </div>
                  
                  {editingOrderId && (
                    <div className="hdr-edit-badge">
                      <FaEdit className="eb-ic"/>
                      <span className="mdl-hdr-sub">{editingOrderNo} • {editingOrderData?.fulfillmentType}</span>
                      <button className="eb-x" onClick={newOrder}><FaTimes/></button>
                    </div>
                  )}

                  <div className="hdr-divider"/>

                  {customerOn && (
                    <div className="hdr-cust-zone" ref={custZoneRef}>
                      <div className="sb-wrap hdr">
                        <FaUsers className="sb-ic"/>
                        <input className="sb-in" placeholder={selectedCustomers.length ? "" : "Search Customer…"} 
                          value={customerSearch} 
                          onChange={e=>{setCustomerSearch(e.target.value); setShowSuggestions(true);}} 
                          onFocus={()=>setShowSuggestions(true)}
                        />
                      </div>
                      
                      <div className="cust-chips">
                        {selectedCustomers.map(c => (
                          <div key={c.id} className="cust-chip" style={{'--theme':themeColor}}>
                            <span className="chip-nm">{c.name}</span>
                            <button className="chip-x" onClick={() => setSelectedCustomers(p => p.filter(x => x.id !== c.id))}><FaTimes/></button>
                          </div>
                        ))}
                      </div>

                      {showSuggestions && (
                        <div className="hdr-cust-suggestions">
                          {(() => {
                            const filtered = customers.filter(c => 
                              (c.name || '').toLowerCase().includes((customerSearch || '').toLowerCase()) || 
                              (c.phone || '').includes(customerSearch)
                            ).filter(c => !selectedCustomers.some(s => s.id === c.id)).slice(0, 6);
                            
                            if (filtered.length === 0 && customerSearch) {
                              return <div className="sugg-none">No customers found</div>;
                            }
                            
                            return filtered.map(c => (
                              <div key={c.id} className="sugg-item" onClick={() => {
                                setSelectedCustomers(p => [...p, c]);
                                setCustomerSearch('');
                                setShowSuggestions(false);
                              }}>
                                <div className="sugg-av">{c.name ? c.name[0] : '?'}</div>
                                <div className="sugg-info">
                                  <div className="sugg-nm">{c.name}</div>
                                  <div className="sugg-ph">{c.phone}</div>
                                </div>
                              </div>
                            ));
                          })()}
                          <div className="sugg-ft" onClick={() => { setCustomerName(customerSearch); setShowNewCustomer(true); setShowSuggestions(false); }}>
                            + Add New Customer
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pos-hdr-c">
            <div className="op-switcher">
              {[
                { id: 'pos',     label: 'POS',     icon: <FaCashRegister/> },
                { id: 'kitchen', label: 'Kitchen', icon: <FaFire/> },
                { id: 'tables',  label: 'Tables',  icon: <FaUtensils/> },
                { id: 'history', label: 'History', icon: <FaReceipt/> }
              ].map(m => (
                <button key={m.id} className={`op-btn ${opMode === m.id ? 'on' : ''}`} onClick={() => setOpMode(m.id)}>
                  {m.icon} <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pos-hdr-r">
            {opMode === 'pos' && (kitchenOn || creditOn) && (
              <div className="pos-modes om-toggle">
                {kitchenOn && (
                  <button className={`mode-btn ${orderMode==='kitchen'?'active':''}`} style={{'--theme':'#f97316'}} onClick={()=>setOrderMode('kitchen')}>
                    <span className="mode-ic"><FaFire/></span><span className="mode-lb mobile-hide">Kitchen</span>
                  </button>
                )}
                <button className={`mode-btn ${orderMode==='settle'?'active':''}`} style={{'--theme':'#16a34a'}} onClick={()=>setOrderMode('settle')}>
                  <span className="mode-ic"><FaWallet/></span><span className="mode-lb mobile-hide">Settle</span>
                </button>
                {creditOn && (
                  <button className={`mode-btn ${orderMode==='credit'?'active':''}`} style={{'--theme':'#6366f1'}} onClick={()=>setOrderMode('credit')}>
                    <span className="mode-ic"><FaCreditCard/></span><span className="mode-lb mobile-hide">Credit</span>
                  </button>
                )}
              </div>
            )}
            <button className="ctx-bk fs-btn" onClick={toggleFS} title={isFS ? "Exit Fullscreen" : "Enter Fullscreen"}>
              {isFS ? <FaCompress/> : <FaExpand/>}
            </button>
            <button className="ctx-bk rst" onClick={newOrder} title="Reset POS"><FaRedo/></button>
          </div>
        </header>

        <div className={"pos-main" + (!listingOn && opMode === 'pos' ? ' no-listing' : '') + (opMode !== 'pos' ? ' full' : '')}>
          {opMode === 'pos' && (
            <>
              <section className="catalog">
                <div className="pos-search-zone" ref={prodZoneRef}>
                  <div className="ps-bar-wrapper">
                    <FaSearch className="ps-ic"/>
                    <input ref={searchRef} className="ps-in" 
                      placeholder={listingOn ? "Search Products…" : "Search & Select Products…"} 
                      value={search} 
                      onChange={e=>{setSearch(e.target.value); if(!listingOn) setShowProdSuggestions(true);}}
                      onFocus={()=>{if(!listingOn) setShowProdSuggestions(true);}}
                    />
                    {search && <button className="ps-clear" onClick={()=>setSearch('')}><FaTimes/></button>}
                    <button className="ps-add-btn" title="Quick Add Product" onClick={()=>setShowQuickProduct(true)}><FaPlus/></button>
                  </div>
                  
                  {!listingOn && showProdSuggestions && (
                    <div className="hdr-cust-suggestions">
                      {(() => {
                        const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8);
                        if (filtered.length === 0) return <div className="sugg-none">No products found</div>;
                        return filtered.map(p => (
                          <div key={p.id} className="sugg-item" onClick={() => {
                            const existing = cart.find(c => c.pid === p.id);
                            if (existing) updQty(p.id, 1);
                            else setCart(prev => [{ 
                              pid: p.id, name: p.name, price: p.price, qty: 1,
                              tax: p.taxRate || defaultTaxRate, uom: p.uomName || 'units',
                              is_packaged: p.isPackagedGood === true
                            }, ...prev]);
                            setSearch('');
                            setShowProdSuggestions(false);
                          }}>
                            <div className="sugg-info">
                              <div className="sugg-nm">{p.name}</div>
                            </div>
                            <div className="sugg-ph" style={{color:'var(--theme)',fontWeight:'800'}}>{sym}{p.price.toFixed(2)}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {listingOn && (
                  <div className="cats-scroll">
                    {catNames.map(c=>(
                      <div key={c} className={`cat-orb ${activeCat===c?'on':''}`} onClick={()=>setActiveCat(c)}>
                        <span className="cat-orb-t">{c==='ALL'?'All':c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {listingOn && (
                <div className="prod-grid">
                  {products
                    .filter(p => (activeCat==='ALL' || p.categoryName===activeCat) && 
                      (p.name.toLowerCase().includes(search.toLowerCase()) || p.productCode?.toLowerCase().includes(search.toLowerCase())))
                    .map(p => (
                      <div key={p.id} className="pc-card">
                        {imagesOn && p.imageUrl && <div className="pc-img-v" style={{backgroundImage:`url(${p.imageUrl})`}}/>}
                        <div className="pc-body">
                          <div className="pc-nm">{p.name}</div>
                          <div className="pc-pr-row">
                            <div className="pc-pr">{sym}{parseFloat(p.price).toFixed(2)}</div>
                            <button className="pc-add" onClick={()=>addToCart(p)}><FaPlus/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                )}
              </section>

              <aside className="cart-panel">
                <div className="cp-hd">
                  <div className="ts-zone">
                    <PremiumDateTimePicker 
                      value={orderTime} 
                      onChange={(val) => setOrderTime(val)} 
                      themeColor={themeColor}
                    />
                  </div>
                </div>
                <div className="cp-body">
                    {(totals.processed_items || cart).map(item => (
                      <div key={item.pid} className="ci-card">
                        {imagesOn && item.img && <div className="ci-img" style={{backgroundImage:`url(${item.img})`}}/>}
                        <div className="ci-info">
                          <div className="ci-nm">{item.name}</div>
                          <div className="ci-pr-row">
                            <div className="ci-pr">
                              {item.lineDiscount > 0 ? (
                                <>
                                  <span style={{textDecoration: 'line-through', color: '#94a3b8', fontSize: '10.5px', marginRight: '6px', fontWeight: 600}}>
                                    {sym}{(item.price * item.qty).toFixed(2)}
                                  </span>
                                  {sym}{(item.price * item.qty - item.lineDiscount).toFixed(2)}
                                </>
                              ) : (
                                <>{sym}{(item.price * item.qty).toFixed(2)}</>
                              )}
                            </div>
                            <div className="ci-qty">
                              <button className="ci-q-btn" onClick={()=>updQty(item.pid,-1)}><FaMinus/></button>
                              <span className="ci-q-val">{item.qty}</span>
                              <button className="ci-q-btn" onClick={()=>updQty(item.pid,1)}><FaPlus/></button>
                            </div>
                          </div>
                          {taxOn && item.tax_amount > 0 && (
                            <div style={{fontSize:'10px', color:'#64748b', marginTop:'4px', display:'flex', justifyContent:'space-between'}}>
                              <span>{taxSplitOn ? `C/S ${taxLabel}` : taxLabel} ({item.tax_rate}%)</span>
                              <span>{pricesInclTax ? '(incl.) ' : '+'}{sym}{item.tax_amount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                <div className="cp-ft">
                  <div className="cp-summary">
                    <div className="cp-row"><span>Sub Total</span><span>{sym}{sub.toFixed(2)}</span></div>
                    {discountOn && orderMode !== 'kitchen' && (
                      discountAmt > 0 ? (
                        <>
                          <div className="cp-row" style={{color:'#ef4444'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                              <span>Discount (-)</span>
                              <button className="disc-edit-link" onClick={()=>{setDiscountTab('order');setShowDiscountModal(true);}}>Edit</button>
                            </div>
                            <span>-{sym}{discountAmt.toFixed(2)}</span>
                          </div>
                          <div className="cp-row"><span>Discounted Total</span><span>{sym}{taxable.toFixed(2)}</span></div>
                        </>
                      ) : (
                        <div className="cp-row">
                          <button className="disc-add-link" onClick={()=>{setDiscountTab('order');setShowDiscountModal(true);}}>+ Add Discount</button>
                        </div>
                      )
                    )}
                    {taxOn && tax > 0.01 && !taxSplitOn && <div className="cp-row"><span>{taxLabel} Total</span><span>{sym}{tax.toFixed(2)}</span></div>}
                    {taxOn && tax > 0.01 && taxSplitOn && (
                      <>
                        <div className="cp-row"><span>C{taxLabel} ({pricesInclTax ? 'incl' : '+'})</span><span>{sym}{(tax/2).toFixed(2)}</span></div>
                        <div className="cp-row"><span>S{taxLabel} ({pricesInclTax ? 'incl' : '+'})</span><span>{sym}{(tax/2).toFixed(2)}</span></div>
                      </>
                    )}
                    {roundOn && Math.abs(autoRoundOff) > 0.001 && (
                      <div className="cp-row" style={{color: autoRoundOff > 0 ? '#16a34a' : '#ef4444', fontSize:'12px'}}>
                        <span>Round Off</span>
                        <span>{autoRoundOff > 0 ? '+' : ''}{sym}{autoRoundOff.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="cp-row tot"><span>Total</span><span>{sym}{total.toFixed(2)}</span></div>
                  </div>
                  <button className="cp-main-act" disabled={!cart.length||saving} onClick={()=>{
                    if(orderMode==='kitchen') placeOrder('kitchen','none',0); 
                    else if(orderMode==='credit') { setPaymentMode('credit'); setShowPaymentDialog(true); }
                    else { setPaymentMode('cash'); setShowPaymentDialog(true); }
                  }}>
                    {saving?'Processing…':(orderMode==='kitchen'?'Send to Kitchen':orderMode==='credit'?'Credit Sale':'Place Order')}
                  </button>
                </div>
              </aside>
            </>
          )}

          {(opMode === 'kitchen' || opMode === 'tables') && (
            <div className="op-view">
              <div className="ov-header">
                {opMode === 'kitchen' ? (
                  <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                    <div className="kitchen-filters">
                      {['TAKEAWAY', 'DELIVERY'].map(f => (
                        <button 
                          key={f} 
                          className={`k-filter-btn ${kitchenFilter === f ? 'on' : ''}`}
                          onClick={() => setKitchenFilter(f)}
                        >
                          {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div style={{display:'flex',gap:'8px',alignItems:'center',width:opMode==='tables'?'100%':'auto',justifyContent:opMode==='tables'?'flex-end':'flex-start', marginBottom:opMode==='tables'?'-10px':'0'}}>
                  {ordersLoading && <span className="ov-loading">Refreshing…</span>}
                  <button className="ov-refresh" onClick={fetchOrders}><FaRedo/></button>
                </div>
              </div>
              
              {opMode === 'kitchen' ? (
                <div className="ov-grid">
                  {allOrders
                    .filter(o => o.fulfillmentType !== 'DINE_IN')
                    .filter(o => kitchenFilter === 'ALL' || o.fulfillmentType === kitchenFilter)
                    .filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED')
                    .map(o => {
                      const isExpanded = expandedOrderId === o.id;
                      return (
                        <div key={o.id} className={`ov-card ${isExpanded ? 'expanded' : ''}`} 
                             style={{borderLeft: `4px solid ${o.fulfillmentType === 'DELIVERY' ? '#0ea5e9' : '#16a34a'}`}}
                             onClick={async () => {
                               if (isExpanded) {
                                 setExpandedOrderId(null);
                               } else {
                                 setExpandedOrderId(o.id);
                                 setDetailsLoading(true);
                                 try {
                                   const r = await api.get(`/api/v1/orders/${o.id}`);
                                   setActiveOrderDetails(r.data.data);
                                 } catch (e) {
                                   showToast('Err', 'error');
                                 } finally {
                                   setDetailsLoading(false);
                                 }
                               }
                             }}>
                          <div className="ov-card-hd">
                            <div style={{display:'flex', flexDirection:'column'}}>
                              <div className="ov-id">#{o.orderNo.slice(-6)}</div>
                              <div style={{fontSize:'10px', fontWeight:700, color:'#94a3b8'}}>{o.fulfillmentType}</div>
                            </div>
                            <div className={`ov-st ${o.orderStatus.toLowerCase()}`}>{o.orderStatus}</div>
                          </div>
                          
                          <div className="ov-details" style={{padding:'8px 0'}}>
                            <div className="ov-time" style={{display:'flex', alignItems:'center', gap:'6px'}}>
                              <FaClock style={{fontSize:'10px', opacity:0.5}}/>
                              <span>{new Date(o.orderDate).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                            </div>
                            {o.customerName && (
                              <div style={{fontSize:'11px', fontWeight:700, color:'#475569', marginTop:'4px'}}>
                                <FaUser style={{fontSize:'9px', marginRight:'4px', opacity:0.5}}/>
                                {o.customerName}
                              </div>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="ov-expand-content" onClick={e => e.stopPropagation()}>
                              <div className="ov-items-list" style={{maxHeight:'150px', overflowY:'auto', borderTop:'1px solid #f1f5f9', paddingTop:'8px', marginTop:'4px'}}>
                                {detailsLoading ? (
                                  <div style={{fontSize:'10px', color:'#94a3b8', textAlign:'center', padding:'10px'}}>Loading Items...</div>
                                ) : activeOrderDetails?.id === o.id ? (
                                  activeOrderDetails.lines?.map((l, idx) => (
                                    <div key={idx} style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'4px'}}>
                                      <span style={{fontWeight:600}}>{l.productName} <span style={{color:'var(--theme)'}}>x{l.quantity}</span></span>
                                    </div>
                                  ))
                                ) : null}
                              </div>

                              <div className="ov-actions" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginTop:'12px', borderTop:'1px solid #f1f5f9', paddingTop:'12px'}}>
                                <button className="vm-pill micro lite edit" onClick={() => loadOrderForEdit(o.id)}>Edit</button>
                                
                                <button className="vm-pill micro lite bill" onClick={async () => {
                                  try {
                                    showToast('Preparing Bill...');
                                    const { data: { data: fullOrder } } = await api.get(`/api/v1/orders/${o.id}`);
                                    const { buildReceiptText } = await import('../../utils/printUtils');
                                    const { printUniversal } = await import('../../utils/printGateway');
                                    const text = buildReceiptText(fullOrder, null, config);
                                    await printUniversal({ text, jobKind: 'bill' });
                                    showToast('Sent to Printer');
                                  } catch (e) {
                                    console.error('Print Error:', e);
                                    showToast('Print failed', 'error');
                                  }
                                }}>Print</button>
                                
                                <button className="vm-pill micro lite complete" style={{gridColumn:'span 2'}} onClick={async () => {
                                  if(!confirm('Complete Order?')) return;
                                  try { 
                                    await api.patch(`/api/v1/orders/${o.id}/status`, null, { params: { status: 'COMPLETED' } }); 
                                    showToast('Done'); 
                                    fetchOrders(); 
                                  } catch (e) { showToast('Err', 'error'); }
                                }}>Complete Transaction</button>
                                
                                <button className="vm-pill micro lite cancel" style={{gridColumn:'span 2'}} onClick={async () => {
                                  if(!confirm('Cancel Order?')) return;
                                  try { 
                                    await api.patch(`/api/v1/orders/${o.id}/status`, null, { params: { status: 'CANCELLED' } }); 
                                    showToast('Cancelled'); 
                                    fetchOrders(); 
                                  } catch (e) { showToast('Err', 'error'); }
                                }}>Cancel Order</button>
                              </div>
                            </div>
                          )}

                          {!isExpanded && (
                            <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', borderTop:'1px solid #f8fafc', paddingTop:'8px'}}>
                               <div style={{fontSize:'10px', fontWeight:800, color:'#94a3b8'}}>{o.totalItems || 0} Items</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="vm-graph" style={{padding:0}}>
                  {(() => {
                    const grouped = tables.reduce((acc, t) => {
                      const f = t.floor || 'Main';
                      const s = t.section || 'General';
                      if (!acc[f]) acc[f] = {};
                      if (!acc[f][s]) acc[f][s] = [];
                      acc[f][s].push(t);
                      return acc;
                    }, {});

                    return Object.entries(grouped).map(([floor, sections]) => (
                      <div key={floor} className="vm-floor-group" style={{marginBottom:'12px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px', padding:'0 2px'}}>
                          <div style={{width:'2px', height:'12px', background:'var(--theme)', borderRadius:'4px', opacity:0.6}}/>
                          <h4 style={{fontSize:'10px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em', color:'#64748b', margin:0}}>{floor}</h4>
                        </div>
                        
                        {Object.entries(sections).map(([section, sectionTables]) => (
                          <div key={section} className="vm-section-group" style={{marginBottom:'8px', paddingLeft:'8px'}}>
                            {section !== 'General' && <div style={{fontSize:'8px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: '4px'}}>{section}</div>}
                            <div className="vm-grid">
                              {sectionTables.map(t => {
                                const s = (t.status||'').toUpperCase();
                                const cls = s==='AVAILABLE'?'av':s==='OCCUPIED'?'occ':s==='BILLED'?'bld':s==='RESERVED'?'res':s==='CLEANING'?'cln':s==='MAINTENANCE'?'mnt':'av';
                                const activeOrder = allOrders.find(o => o.tableNumber === t.tableNumber && o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED');
                                
                                return (
                                  <button key={t.id} className={`vm-node ${cls} ${t.shape==='round'?'round':''}`} onClick={()=>pickTable(t)}>
                                    <div className="vm-node-c">
                                      <span className="vm-node-n">{t.tableNumber}</span>
                                      {activeOrder ? (
                                        <span className="vm-node-s" style={{fontSize:'10px',fontWeight:700,color:'var(--theme)'}}>{sym}{activeOrder.grandTotal.toFixed(0)}</span>
                                      ) : (
                                        <span className="vm-node-s"><FaUsers/> {t.seatingCapacity||4}</span>
                                      )}
                                    </div>
                                    {s==='OCCUPIED' && <div className="vm-pulse"/>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                  
                  {opMode === 'tables' && (
                    <div className="vm-floating-leg">
                      <div className="vm-leg-i"><span className="vm-dot av"/>Available</div>
                      <div className="vm-leg-i"><span className="vm-dot occ"/>Occupied</div>
                      <div className="vm-leg-i"><span className="vm-dot bld"/>Billed</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {opMode === 'history' && (
            <div className="op-view">
              <ReportTable
                accentColor={themeColor}
                columns={[
                  { 
                    key: 'orderNo', 
                    label: 'Order #',
                    render: (o) => (
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontFamily:'monospace', fontWeight:800, color:themeColor, fontSize:'13px'}}>{o.orderNo}</span>
                        <span style={{fontSize:'9px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase'}}>{o.fulfillmentType}</span>
                      </div>
                    )
                  },
                  {
                    key: 'invoiceNo',
                    label: 'Invoice No',
                    render: (o) => <span style={{fontWeight:700, color:'#475569'}}>{o.invoiceNo || '-'}</span>
                  },
                  {
                    key: 'paymentNo',
                    label: 'Payment No',
                    render: (o) => <span style={{fontWeight:700, color:'#475569'}}>{o.paymentNo || '-'}</span>
                  },
                  { 
                    key: 'orderDate', 
                    label: 'Date & Time',
                    render: (o) => (
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontWeight:700}}>{new Date(o.orderDate).toLocaleDateString()}</span>
                        <span style={{fontSize:'10px', opacity:0.6}}>{new Date(o.orderDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                    )
                  },
                  { 
                    key: 'grandTotal', 
                    label: 'Total', 
                    align: 'right',
                    render: (o) => <span style={{fontWeight:900, color:'#0f172a', fontSize:'14px'}}>{sym}{o.grandTotal.toFixed(2)}</span>
                  },
                  {
                    key: 'actions',
                    label: '',
                    align: 'right',
                    render: (o) => {
                      const canManage = userRole?.includes('ADMIN') || userRole?.includes('MANAGER');
                      return (
                        <div style={{display:'flex', gap:'6px', justifyContent:'flex-end'}}>
                          {canManage && (
                            <>
                              <button className="vm-pill micro lite edit" style={{padding:'6px 10px', fontSize:'9px'}} onClick={() => { console.log('Edit Clicked for ID:', o.id); loadOrderForEdit(o.id); }}>
                                Edit
                              </button>
                              <button className="vm-pill micro lite cancel" style={{padding:'6px 10px', fontSize:'9px'}} onClick={async () => {
                                if(!confirm('Are you sure you want to CANCEL this order? This will void the transaction.')) return;
                                try {
                                  await api.patch(`/api/v1/orders/${o.id}/status`, null, { params: { status: 'CANCELLED' } });
                                  showToast('Order Cancelled');
                                  fetchOrders();
                                } catch (e) { showToast('Cancel Failed', 'error'); }
                              }}>Cancel</button>
                            </>
                          )}
                          <button className="vm-pill micro lite bill" style={{padding:'6px 10px', fontSize:'9px', minWidth:'50px'}} onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              showToast('Re-printing...');
                              const { data: { data: fullOrder } } = await api.get(`/api/v1/orders/${o.id}`);
                              const text = buildReceiptText(fullOrder, null, config);
                              await printUniversal({ text, jobKind: 'bill', allowSystemDialog: true });
                              showToast('Sent to Printer');
                            } catch (err) { 
                              console.error('Reprint Error:', err);
                              showToast('Print Error', 'error'); 
                            }
                          }}>Print</button>
                        </div>
                      );
                    }
                  }
                ]}
                data={allOrders.filter(o => o.orderStatus === 'COMPLETED' || o.orderStatus === 'PAID')}
                emptyTitle="No completed orders"
                emptyText="Once orders are finalized, they will appear here in your history."
              />
            </div>
          )}
        </div>

        {phase==='table' && (
          <div className="vm-overlay">
            <div className="vm-modal">
              <div className="vm-body">
                <div className="vm-top-strip">
                  <div className="vm-modes-row">
                    {FULFILLMENT.map(f=>(
                      <button key={f.key} className={`vm-m-btn ${fulfillmentType===f.key?'on':''}`} style={{'--m-clr':f.color}} onClick={()=>{setFulfillmentType(f.key); if(f.key!=='DINE_IN'){setTableNumber('');setPhase('pos');}}}>
                        <span className="vm-m-ic">{f.icon}</span>{f.label}
                      </button>
                    ))}
                  </div>
                  <button className="vm-top-x" onClick={()=>setPhase('pos')}><FaTimes/></button>
                </div>

                <div className="vm-ctrl-strip">
                  <div className="vm-f-scroller">
                    {['ALL',...new Set(tables.map(t=>t.floor).filter(Boolean))].map(f=>(
                      <button key={f} className={`vm-f-btn ${activeFloor===f?'on':''}`} onClick={()=>setActiveFloor(f)}>{f==='ALL'?'All Zones':f}</button>
                    ))}
                  </div>
                  <div className="vm-leg-scroller">
                    <div className="vm-leg-i"><span className="vm-dot av"/>Available</div>
                    <div className="vm-leg-i"><span className="vm-dot occ"/>Occupied</div>
                    <div className="vm-leg-i"><span className="vm-dot bld"/>Billed</div>
                    <div className="vm-leg-i"><span className="vm-dot res"/>Reserved</div>
                    <div className="vm-leg-i"><span className="vm-dot cln"/>Cleaning</div>
                    <div className="vm-leg-i"><span className="vm-dot mnt"/>Service</div>
                  </div>
                </div>

                <div className="vm-graph">
                  <div className="vm-grid">
                    {tables.filter(t=>activeFloor==='ALL'||t.floor===activeFloor).map(t=>{
                      const s = (t.status||'').toUpperCase();
                      const cls = s==='AVAILABLE'?'av':s==='OCCUPIED'?'occ':s==='BILLED'?'bld':s==='RESERVED'?'res':s==='CLEANING'?'cln':s==='MAINTENANCE'?'mnt':'av';
                      return (
                        <button key={t.id} className={`vm-node ${cls} ${t.shape==='round'?'round':''}`} onClick={()=>pickTable(t)}>
                          <div className="vm-node-c">
                            <span className="vm-node-n">{t.tableNumber}</span>
                            <span className="vm-node-s"><FaUsers/> {t.seatingCapacity||4}</span>
                          </div>
                          {s==='OCCUPIED' && <div className="vm-pulse"/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="vm-ft"><button className="vm-skip" onClick={()=>{setTableNumber('');setPhase('pos');}}>Skip →</button></div>
            </div>
          </div>
        )}

      {showPaymentDialog && (
        <div className="mdl-ov" onClick={()=>setShowPaymentDialog(false)}>
          <div className="mdl-box" onClick={e=>e.stopPropagation()} style={{maxWidth:460}}>
            <div className="mdl-hdr theme-bg">
              <div className="mdl-hdr-info">
                <h3 className="mdl-hdr-t">{paymentMode==='credit'?'Confirm Credit Sale':'Payment Confirmation'}</h3>
                <span className="mdl-hdr-sub">SELECT PAYMENT METHOD & FINALIZE</span>
              </div>
              <button className="mdl-hdr-x" onClick={()=>setShowPaymentDialog(false)}><FaTimes/></button>
            </div>
            <div className="mdl-body">
              <div style={{padding:'12px 20px', background:'#f8fafc', borderRadius:'10px', margin:'0 0 16px 0', display:'flex', flexDirection:'column', gap:'6px'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b'}}><span>Gross Total (Incl. Tax)</span><span>{sym}{grossInc.toFixed(2)}</span></div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b'}}><span>Subtotal (Ex-Tax)</span><span>{sym}{subEx.toFixed(2)}</span></div>
                {discountAmt > 0 && <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#ef4444'}}><span>Discount</span><span>-{sym}{discountAmt.toFixed(2)}</span></div>}
                <div style={{height: '1px', background: '#e2e8f0', margin: '4px 0'}}></div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b'}}><span>Taxable Value</span><span>{sym}{taxable.toFixed(2)}</span></div>
                {taxOn && tax > 0.01 && !taxSplitOn && <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b'}}><span>{taxLabel} (+)</span><span>{sym}{tax.toFixed(2)}</span></div>}
                {taxOn && tax > 0.01 && taxSplitOn && (
                  <>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b'}}><span>C{taxLabel} (+)</span><span>{sym}{(tax/2).toFixed(2)}</span></div>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b'}}><span>S{taxLabel} (+)</span><span>{sym}{(tax/2).toFixed(2)}</span></div>
                  </>
                )}
                {roundOn && Math.abs(autoRoundOff) > 0.001 && <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color: autoRoundOff > 0 ? '#16a34a' : '#ef4444'}}><span>Round Off</span><span>{autoRoundOff > 0 ? '+' : ''}{sym}{autoRoundOff.toFixed(2)}</span></div>}
              </div>
              <div className="mdl-settled"><span>Settled Total</span><b className="theme-text">{sym}{settledAmount.toFixed(2)}</b></div>
              {paymentMode!=='credit' && (
                <div className="pay-grid">
                  {[{k:'cash',l:'💵 Cash'},{k:'online',l:'💳 Online'},{k:'mixed',l:'🔀 Mixed'}].map(pm=>(
                    <button key={pm.k} className={`pay-opt ${paymentMethod===pm.k?'on':''}`} style={{'--pc':'var(--theme)'}} onClick={()=>setPaymentMethod(pm.k)}><span>{pm.l}</span></button>
                  ))}
                </div>
              )}
              <div className="mdl-acts-row">
                <button className="mdl-btn-discard" onClick={()=>setShowPaymentDialog(false)}>Discard</button>
                <button className="mdl-btn-confirm theme-bg" disabled={saving} onClick={()=>placeOrder(paymentMode,paymentMethod,settledAmount-total)}>{saving?'Processing…':'Confirm & Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="mdl-ov" onClick={()=>setShowDiscountModal(false)}>
          <div className="mdl-box" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
            <div className="mdl-hdr theme-bg">
              <div className="mdl-hdr-info">
                <h3 className="mdl-hdr-t">Discounts</h3>
                <span className="mdl-hdr-sub">LINE-WISE & ORDER-LEVEL</span>
              </div>
              <button className="mdl-hdr-x" onClick={()=>setShowDiscountModal(false)}><FaTimes/></button>
            </div>
            <div className="mdl-body" style={{padding:0}}>
              {/* Tabs */}
              <div className="disc-tabs">
                <button className={`disc-tab ${discountTab==='line'?'on':''}`} onClick={()=>setDiscountTab('line')}>Line-wise</button>
                <button className={`disc-tab ${discountTab==='order'?'on':''}`} onClick={()=>setDiscountTab('order')}>Bill Discount</button>
              </div>

              {discountTab === 'line' && (
                <div className="disc-line-list">
                  {cart.length === 0 && <div style={{padding:'24px',textAlign:'center',color:'#94a3b8',fontSize:'13px',fontWeight:600}}>Cart is empty</div>}
                  {cart.map(item => {
                    const lineDiscVal = item.lineDiscount || 0;
                    return (
                      <div key={item.pid} className="disc-line-item">
                        <div className="disc-line-info">
                          <div className="disc-line-nm">{item.name}</div>
                          <div className="disc-line-meta">{sym}{item.price} × {item.qty} = {sym}{(item.price*item.qty).toFixed(2)}</div>
                        </div>
                        <div className="disc-line-input-wrap">
                          <span className="disc-line-sym">{sym}</span>
                          <input
                            type="number"
                            className="disc-line-input"
                            placeholder="0"
                            value={lineDiscVal || ''}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setCart(prev => prev.map(c => c.pid === item.pid ? { ...c, lineDiscount: val, discount: { type: 'amount', value: val } } : c));
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {discountTab === 'order' && (
                <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:'16px'}}>
                  <div className="disc-type-row">
                    <button className={`dt-chip ${discount.type==='amount'?'on':''}`} onClick={()=>setDiscount(d=>({...d,type:'amount'}))}>{sym} Amount</button>
                    <button className={`dt-chip ${discount.type==='percent'?'on':''}`} onClick={()=>setDiscount(d=>({...d,type:'percent'}))}>% Percent</button>
                  </div>
                  <div className="mdl-field">
                    <label>🏷️ Discount Value</label>
                    <input type="number" placeholder="0.00" value={discount.value || ''} onChange={e=>setDiscount(d=>({...d,value:parseFloat(e.target.value)||0}))}/>
                  </div>

                </div>
              )}

              <div style={{padding:'12px 20px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'center'}}>
                <button className="mdl-btn-confirm" style={{width:'100%',maxWidth:'240px'}} onClick={()=>setShowDiscountModal(false)}>Apply & Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCustomerPicker && (
        <div className="mdl-ov" onClick={()=>setShowCustomerPicker(false)}>
          <div className="mdl-box" onClick={e=>e.stopPropagation()} style={{maxWidth:450}}>
            <div className="mdl-accent" style={{background:'var(--theme)'}}/>
            <button className="mdl-x" onClick={()=>setShowCustomerPicker(false)}><FaTimes/></button>
            <div className="mdl-inner">
              <h3 className="mdl-t ctr">Select Customer</h3>
              <div className="mdl-field"><input placeholder="Search customer…" value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)}/></div>
              <div className="cust-list">
                {customers.filter(c=>c.name?.toLowerCase().includes(customerSearch.toLowerCase())).map(c=>(
                  <button key={c.id} className="cust-item" onClick={()=>{setSelectedCustomerId(c.id);setShowCustomerPicker(false);}}>
                    <div className="cust-av">{c.name[0]}</div>
                    <div className="cust-info"><div className="cust-nm">{c.name}</div><div className="cust-ph">{c.phone}</div></div>
                  </button>
                ))}
              </div>
              <button className="mdl-confirm" style={{width:'100%',background:'var(--theme)'}} onClick={()=>{setShowCustomerPicker(false);setShowNewCustomer(true);}}>+ Create New</button>
            </div>
          </div>
        </div>
      )}

      {showNewCustomer && (
        <div className="mdl-ov" onClick={()=>setShowNewCustomer(false)}>
          <div className="mdl-box" onClick={e=>e.stopPropagation()} style={{maxWidth:380}}>
            <div className="mdl-hdr theme-bg">
              <div className="mdl-hdr-info">
                <h3 className="mdl-hdr-t">New Customer</h3>
                <span className="mdl-hdr-sub">ADD TO DATABASE INSTANTLY</span>
              </div>
              <button className="mdl-hdr-x" onClick={()=>setShowNewCustomer(false)}><FaTimes/></button>
            </div>
            <div className="mdl-body">
              <div className="mdl-field"><label>👤 Full Name</label><input placeholder="e.g. John Doe" value={customerName} onChange={e=>setCustomerName(e.target.value)}/></div>
              <div className="mdl-field"><label>📞 Phone Number</label><input placeholder="e.g. 9876543210" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/></div>
              <div className="mdl-acts-row">
                <button className="mdl-btn-discard" onClick={()=>setShowNewCustomer(false)}>Discard</button>
                <button className="mdl-btn-confirm theme-bg" disabled={custSaving} onClick={createCustomer}>{custSaving?'Saving…':'Confirm & Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuickProduct && (
        <div className="mdl-ov" onClick={()=>setShowQuickProduct(false)}>
          <div className="mdl-box" onClick={e=>e.stopPropagation()} style={{maxWidth:420}}>
            <div className="mdl-hdr theme-bg">
              <div className="mdl-hdr-info">
                <h3 className="mdl-hdr-t">Quick Add Item</h3>
                <span className="mdl-hdr-sub">ADD TO MENU & CART INSTANTLY</span>
              </div>
              <button className="mdl-hdr-x" onClick={()=>setShowQuickProduct(false)}><FaTimes/></button>
            </div>
            <div className="mdl-body">
              <div className="mdl-field"><label>🍽️ ITEM NAME</label><input placeholder="e.g. Special Masala Tea" value={qpName} onChange={e=>setQpName(e.target.value)}/></div>
              
              <div className="mdl-field-row">
                <div className="mdl-field"><label>💰 PRICE ({sym})</label><input type="number" placeholder="0.00" value={qpPrice} onChange={e=>setQpPrice(e.target.value)}/></div>
                <div className="mdl-field"><label>🏷️ CODE</label><input placeholder="Opt" value={qpCode} onChange={e=>setQpCode(e.target.value)}/></div>
              </div>
              
              <div className="mdl-field"><label>📂 CATEGORY</label><input placeholder="Quick Add" value={qpCat} onChange={e=>setQpCat(e.target.value)}/></div>
              {qpPkg && (
                <div className="mdl-field"><label>🧾 TAX RATE (%)</label><input type="number" placeholder="e.g. 18" value={qpTax} onChange={e=>setQpTax(e.target.value)}/></div>
              )}
              
              <div className="qp-toggles">
                <label className="tg-lbl"><input type="checkbox" checked={qpVeg} onChange={e=>setQpVeg(e.target.checked)}/> <span className="tg-slider veg"/> Pure Veg</label>
                <label className="tg-lbl"><input type="checkbox" checked={qpPkg} onChange={e=>setQpPkg(e.target.checked)}/> <span className="tg-slider pkg"/> Packaged</label>
              </div>

              <div className="mdl-acts-row" style={{marginTop:'8px'}}>
                <button className="mdl-btn-discard" onClick={()=>setShowQuickProduct(false)}>Discard</button>
                <button className="mdl-btn-confirm theme-bg" disabled={qpSaving} onClick={createQuickProduct}>{qpSaving?'Saving…':'Confirm & Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      <style jsx global>{`
        .content-area { padding: 0 !important; }
        .dashboard-header { border-bottom: 1px solid #e2e8f0; }
        .mdl-ov{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:vmFade .2s}
        .mdl-box{background:#fff;border-radius:20px;width:100%;overflow:hidden;position:relative;animation:vmSlide .3s cubic-bezier(0.16,1,0.3,1);box-shadow:0 30px 60px rgba(0,0,0,0.12); border:1px solid #e2e8f0; border-top:3px solid #f97316}
        .theme-bg{background:rgba(var(--rgb), 0.05) !important;color:var(--theme) !important}
        .theme-text{color:var(--theme)}
        .mdl-hdr{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .mdl-hdr-info{display:flex;flex-direction:column;gap:2px}
        .mdl-hdr-t{margin:0;font-size:17px;font-weight:900;color:inherit}
        .mdl-hdr-sub{font-size:9px;font-weight:800;letter-spacing:0.5px;opacity:0.6;text-transform:uppercase;color:inherit}
        .mdl-hdr-x{width:28px;height:28px;border-radius:8px;border:none;background:rgba(0,0,0,0.05);color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s}
        .mdl-hdr-x:hover{background:rgba(0,0,0,0.1);transform:rotate(90deg)}
        .mdl-body{padding:20px;display:flex;flex-direction:column;gap:16px;background:#fff}
        .mdl-field-row{display:flex;gap:12px}
        .mdl-field-row > div{flex:1}
        .mdl-field{display:flex;flex-direction:column;gap:6px}
        .mdl-field label{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;display:flex;align-items:center;gap:6px}
        .mdl-field input{width:100%;padding:12px 16px;border:2px solid #f1f5f9;border-radius:12px;outline:none;font:600 14px inherit;background:#f8fafc;color:#0f172a}
        .mdl-field input:focus{border-color:var(--theme);background:#fff}
        .mdl-field input::placeholder{color:#cbd5e1}
        .qp-toggles{display:flex;gap:24px;margin-top:8px;padding-top:16px;border-top:1px solid #f1f5f9}
        .tg-lbl{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:#0f172a;cursor:pointer}
        .tg-lbl input{display:none}
        .tg-slider{width:40px;height:22px;background:#cbd5e1;border-radius:20px;position:relative;transition:.3s}
        .tg-slider::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.3s}
        .tg-lbl input:checked + .tg-slider.veg{background:#16a34a}
        .tg-lbl input:checked + .tg-slider.pkg{background:#3b82f6}
        .tg-lbl input:checked + .tg-slider::after{transform:translateX(18px)}
        .mdl-acts-row{display:flex;gap:10px;margin-top:4px}
        .mdl-btn-discard{flex:1;padding:12px;border-radius:10px;border:2px solid #f1f5f9;background:#fff;color:#94a3b8;font:800 12px inherit;cursor:pointer;transition:.2s}
        .mdl-btn-discard:hover{background:#f8fafc;color:#64748b}
        .mdl-btn-confirm{flex:1;padding:12px;border-radius:10px;border:none;background:var(--theme);color:#fff;font:800 12px inherit;cursor:pointer;transition:.2s;box-shadow:0 4px 12px rgba(var(--rgb),0.2)}
        .mdl-btn-confirm:hover{filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 8px 16px rgba(var(--rgb),0.3)}
        .mdl-settled{display:flex;align-items:center;justify-content:center;gap:10px;padding:16px;background:#f8fafc;border-radius:16px;margin-bottom:20px}
        .mdl-settled span{font-size:12px;font-weight:700;color:#94a3b8}
        .mdl-settled b{font-size:24px;font-weight:900}
        .pay-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .pay-opt{padding:12px;border-radius:12px;border:2px solid #f1f5f9;background:#fff;cursor:pointer;font:700 12px inherit}
        .pay-opt.on{border-color:var(--pc);background:rgba(var(--pc),0.05);color:var(--pc)}
        .cust-list{max-height:300px;overflow-y:auto;margin-top:10px}
        .cust-item{display:flex;align-items:center;gap:12px;width:100%;padding:10px;border-radius:12px;border:none;background:transparent;cursor:pointer;text-align:left}
        .cust-item:hover{background:#f8fafc}
        .cust-av{width:40px;height:40px;border-radius:10px;background:#fff7ed;color:#f97316;display:flex;align-items:center;justify-content:center;font-weight:900}
        .cust-info{flex:1}
        .cust-nm{font-size:14px;font-weight:700;color:#0f172a}
        .cust-ph{font-size:11px;color:#94a3b8}
        @keyframes vmFade{from{opacity:0}to{opacity:1}}
        @keyframes vmSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

        .edit-modal-box{background:#fff;border-radius:32px;width:95%;max-width:900px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 50px 100px rgba(0,0,0,0.25);animation:vmSlide .4s cubic-bezier(0.16,1,0.3,1)}
        .em-hdr{padding:24px 30px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #f1f5f9}
        .em-main{flex:1;overflow:hidden;display:flex;background:#f8fafc}
        .em-list-panel{flex:1.4;padding:24px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;border-right:1px solid #f1f5f9}
        .em-summary-panel{flex:1;padding:24px;background:#fff;overflow-y:auto;display:flex;flex-direction:column;gap:20px}
        .em-search-wrap{position:relative;margin-bottom:8px}
        .em-search{width:100%;padding:14px 16px 14px 44px;border:2px solid #e2e8f0;border-radius:16px;outline:none;font:600 14px inherit;background:#fff;transition:.2s}
        .em-search:focus{border-color:var(--theme);box-shadow:0 0 0 4px rgba(var(--rgb),0.1)}
        .em-s-ic{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#94a3b8}
        .em-sugg{position:absolute;top:100%;left:0;right:0;background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.1);z-index:100;margin-top:8px;border:1px solid #e2e8f0;overflow:hidden}
        .em-sugg-item{padding:12px 16px;display:flex;justify-content:space-between;cursor:pointer;transition:.2s}
        .em-sugg-item:hover{background:#f8fafc}
        .em-item{background:#fff;padding:16px;border-radius:20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 8px rgba(0,0,0,0.02);border:1px solid #f1f5f9}
        .em-item-nm{font-size:14px;font-weight:700;color:#0f172a}
        .em-item-pr{font-size:12px;font-weight:800;color:#64748b}
        .em-qty-ctrl{display:flex;align-items:center;gap:12px;background:#f1f5f9;padding:4px;border-radius:12px}
        .em-qty-btn{width:28px;height:28px;border-radius:8px;border:none;background:#fff;color:#0f172a;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
        .em-qty-val{font-size:14px;font-weight:900;min-width:20px;text-align:center}
        .em-del{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#ef4444;background:#fef2f2;cursor:pointer;transition:.2s}
        .em-del:hover{background:#fee2e2;transform:scale(1.05)}
        .ctx-bk{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border:none;color:#64748b;cursor:pointer;transition:.2s}
        .ctx-bk:hover{background:#e2e8f0;color:#0f172a;transform:rotate(90deg)}
      `}</style>

      <style jsx>{POS_CSS}</style>
      <style jsx>{SETUP_CSS}</style>

      {showEditModal && editingOrderData && (
        <div style={{position:'fixed', inset:0, zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(12px)', background:'rgba(15, 23, 42, 0.15)'}}>
          <div className="edit-modal-box">
            <div className="em-hdr">
              <div>
                <div style={{fontSize:'12px', fontWeight:800, color: 'var(--theme)', textTransform:'uppercase', letterSpacing:'0.06em'}}>Order Management</div>
                <div style={{fontSize:'20px', fontWeight:900, color:'#0f172a'}}>Review Order {editingOrderNo}</div>
              </div>
              <button className="ctx-bk" onClick={() => setShowEditModal(false)}><FaTimes/></button>
            </div>
            
            <div className="em-main">
              <div className="em-list-panel">
                <div className="em-search-wrap">
                  <FaSearch className="em-s-ic"/>
                  <input className="em-search" placeholder="Add items to this order..." 
                    value={search} onChange={e => setSearch(e.target.value)}/>
                  {search && (
                    <div className="em-sugg">
                      {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(p => (
                        <div key={p.id} className="em-sugg-item" onClick={() => {
                          const ex = editingOrderData?.lines?.find(l => l.pid === p.id);
                          if (ex) {
                            setEditingOrderData(prev => ({
                              ...prev,
                              lines: prev.lines.map(l => l.pid === p.id ? { ...l, qty: l.qty + 1 } : l)
                            }));
                          } else {
                            setEditingOrderData(prev => ({
                              ...prev,
                              lines: [{ 
                                pid: p.id, name: p.name, price: p.price, qty: 1, 
                                tax: p.taxRate || defaultTaxRate, uom: p.uomName || 'units' 
                              }, ...(editingOrderData?.lines || [])]
                            }));
                          }
                          setSearch('');
                        }}>
                          <span style={{fontWeight:700, fontSize:'13px'}}>{p.name}</span>
                          <span style={{fontWeight:800, color:'var(--theme)'}}>{sym}{p.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {editingOrderData?.lines?.map((l, idx) => (
                  <div key={idx} className="em-item">
                    <div className="em-item-info">
                      <div className="em-item-nm">{l.name}</div>
                      <div className="em-item-pr">{sym}{l.price.toFixed(2)}</div>
                    </div>
                    <div className="em-qty-ctrl">
                      <button className="em-qty-btn" onClick={() => {
                         setEditingOrderData(prev => ({
                           ...prev,
                           lines: prev.lines.map((li, i) => i === idx ? { ...li, qty: Math.max(1, li.qty - 1) } : li)
                         }));
                      }}><FaMinus/></button>
                      <span className="em-qty-val">{l.qty}</span>
                      <button className="em-qty-btn" onClick={() => {
                         setEditingOrderData(prev => ({
                           ...prev,
                           lines: prev.lines.map((li, i) => i === idx ? { ...li, qty: li.qty + 1 } : li)
                         }));
                      }}><FaPlus/></button>
                    </div>
                    <div className="em-del" onClick={() => {
                      setEditingOrderData(prev => ({
                        ...prev,
                        lines: prev.lines.filter((_, i) => i !== idx)
                      }));
                    }}><FaTrash/></div>
                  </div>
                ))}
              </div>

              <div className="em-summary-panel">
                <div style={{flex:1}}>
                  <div style={{marginBottom:'20px'}}>
                    <div style={{fontSize:'11px', fontWeight:800, color:'#94a3b8', marginBottom:'8px', textTransform:'uppercase'}}>Fulfillment</div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                      {FULFILLMENT.map(f => (
                        <button key={f.key} 
                          onClick={() => setEditingOrderData(p => ({ ...p, fulfillmentType: f.key }))}
                          style={{
                            padding:'10px', borderRadius:'14px', border:'1px solid #f1f5f9',
                            background: editingOrderData?.fulfillmentType === f.key ? f.color + '10' : '#fff',
                            color: editingOrderData?.fulfillmentType === f.key ? f.color : '#64748b',
                            display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', transition:'0.2s',
                            fontSize:'11px', fontWeight:800
                          }}
                        >
                          {f.icon} {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{background:'#f8fafc', padding:'20px', borderRadius:'24px', display:'flex', flexDirection:'column', gap:'12px'}}>
                    {(() => {
                      const mTotals = calculateOrderTotals(
                        (editingOrderData?.lines || []).map(l => ({ ...l, quantity: l.qty, tax_rate: l.tax })),
                        discount,
                        { gst_enabled: taxOn, default_tax_rate: defaultTaxRate, prices_include_tax: pricesInclTax }
                      );
                      return (
                        <>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:600, color:'#64748b'}}>
                            <span>Subtotal</span>
                            <span>{sym}{mTotals.gross_face_total.toFixed(2)}</span>
                          </div>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:600, color:'#64748b'}}>
                            <span>Tax</span>
                            <span>{sym}{mTotals.total_tax.toFixed(2)}</span>
                          </div>
                          <div style={{height:'1px', background:'#e2e8f0', margin:'4px 0'}}/>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:'18px', fontWeight:900, color:'#0f172a'}}>
                            <span>Total</span>
                            <span style={{color:'var(--theme)'}}>{sym}{mTotals.total_amount.toFixed(0)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <button className="vm-pill" style={{width:'100%', padding:'18px', borderRadius:'20px', background:'var(--theme)', color:'#fff', border:'none', fontSize:'14px', fontWeight:900, boxShadow:'0 10px 25px var(--theme-glow)', cursor:'pointer'}} 
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const mTotals = calculateOrderTotals(
                        editingOrderData.lines.map(l => ({ ...l, quantity: l.qty, tax_rate: l.tax })),
                        discount,
                        { gst_enabled: taxOn, default_tax_rate: defaultTaxRate, prices_include_tax: pricesInclTax }
                      );
                      const payload = {
                        ...editingOrderData,
                        totalAmount: +mTotals.total_inc_tax.toFixed(2),
                        totalTaxAmount: +mTotals.total_tax.toFixed(2),
                        grandTotal: +mTotals.total_amount.toFixed(2),
                        lines: editingOrderData.lines.map(l => ({
                          productId: l.pid, quantity: l.qty, unitPrice: l.price,
                          unitOfMeasure: l.uom, taxRate: l.tax,
                          taxAmount: +((l.price * l.qty * l.tax) / 100).toFixed(2),
                          lineTotal: +((l.price * l.qty) * (1 + l.tax/100)).toFixed(2)
                        }))
                      };
                      await api.put(`/api/v1/orders/${editingOrderData.id}`, payload);
                      
                      // Differential Print Logic
                      try {
                        const { buildReceiptText } = await import('../../utils/printUtils');
                        const { printUniversal } = await import('../../utils/printGateway');
                        const printPayload = { ...payload, originalLines: editingOrderData.originalLines };
                        const text = buildReceiptText(printPayload, null, config);
                        await printUniversal({ text, jobKind: 'receipt' });
                      } catch (err) { console.error('Differential Print Failed', err); }

                      showToast('Order Updated Successfully!');
                      setShowEditModal(false);
                      fetchOrders();
                    } catch (e) { showToast('Update failed', 'error'); }
                    finally { setSaving(false); }
                }}>
                  {saving ? 'Saving...' : 'Update Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .vm-pill.micro.lite{
          padding:12px 4px; border:none; border-radius:18px; cursor:pointer; font:900 10px inherit; 
          text-transform:uppercase; letter-spacing:0.04em; transition:.3s; text-align:center;
        }
        .vm-pill.edit{ background:#eff6ff; color:#3b82f6; }
        .vm-pill.bill{ background:#fff7ed; color:#f97316; }
        .vm-pill.complete{ background:#f0fdf4; color:#10b981; }
        .vm-pill.cancel{ background:#fef2f2; color:#ef4444; }
        
        .vm-pill:hover{ filter:brightness(0.97); transform:scale(1.02); }
        .vm-pill:active{ transform:scale(0.98); }
        .h-scale:hover{ transform:rotate(90deg) scale(1.1); background:#fef2f2 !important; }

        .edit-modal-box {
          width: 90%;
          max-width: 900px;
          height: 80vh;
          background: #fff;
          border-radius: 32px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.25);
        }
        .em-hdr { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fff; }
        .em-main { flex: 1; display: grid; grid-template-columns: 1fr 340px; overflow: hidden; }
        .em-list-panel { padding: 24px 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: #f8fafc; }
        .em-summary-panel { padding: 24px; border-left: 1px solid #f1f5f9; background: #fff; display: flex; flex-direction: column; }
        
        .em-item { 
          background: #fff; padding: 16px; border-radius: 20px; display: flex; align-items: center; gap: 16px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #f1f5f9;
        }
        .em-item-info { flex: 1; }
        .em-item-nm { font-size: 14px; font-weight: 800; color: #0f172a; }
        .em-item-pr { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 2px; }
        .em-qty-ctrl { display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 4px; border-radius: 12px; }
        .em-qty-btn { width: 28px; height: 28px; border: none; background: #fff; border-radius: 8px; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .em-qty-val { font-size: 14px; font-weight: 900; min-width: 20px; text-align: center; }
        .em-del { color: #ef4444; cursor: pointer; padding: 8px; opacity: 0.5; transition: 0.2s; }
        .em-del:hover { opacity: 1; transform: scale(1.1); }
        
        .em-search-wrap { margin-bottom: 8px; position: relative; }
        .em-search { width: 100%; padding: 12px 16px 12px 40px; border-radius: 16px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 13px; font-weight: 600; outline: none; transition: 0.2s; }
        .em-search:focus { background: #fff; border-color: var(--theme); box-shadow: 0 0 0 4px var(--theme-glow); }
        .em-s-ic { position: absolute; left: 16px; top: 14px; color: #94a3b8; font-size: 14px; }
        
        .em-sugg { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; z-index: 10; max-height: 200px; overflow-y: auto; }
        .em-sugg-item { padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; }
        .em-sugg-item:hover { background: #f8fafc; color: var(--theme); }
        
        .em-ft { padding: 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; }
      `}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}

function Toast({msg,type,onClose}){
  return (
    <div className={`tst ${type}`} onClick={onClose}>
      <div className="tst-i">{type==='success'?<FaCheck/>:<FaExclamationCircle/>}</div>
      <div className="tst-m">{msg}</div>
      <style jsx>{`.tst{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:white;padding:12px 20px;border-radius:16px;display:flex;align-items:center;gap:12px;z-index:99999;box-shadow:0 20px 40px rgba(0,0,0,0.2);cursor:pointer;animation:tIn .3s}.tst.error{background:#ef4444}@keyframes tIn{from{transform:translate(-50%,20px);opacity:0}to{transform:translate(-50%,0);opacity:1}}`}</style>
    </div>
  );
}

const POS_CSS = `
.pos-container{display:flex;flex-direction:column;min-height:calc(100vh - 64px);height:calc(100vh - 64px);height:calc(100dvh - 64px);background:#f8fafc;overflow:hidden;color:#000;--theme-glow: rgba(var(--rgb), 0.03);border-top:2px solid var(--theme);}
.pos-hdr{background:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;z-index:50;box-shadow:0 4px 20px var(--theme-glow);gap:12px;flex-wrap:wrap;}
.pos-hdr-l,.pos-hdr-r{display:flex;align-items:center;gap:8px;min-width:0}
.pos-hdr-controls{display:flex;align-items:center;min-width:0;overflow:hidden}
.hdr-context-group{display:flex;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:2px;gap:2px}
.hdr-divider{width:1px;height:24px;background:#e2e8f0;margin:0 4px}
.hdr-edit-badge{display:flex;align-items:center;gap:8px;background:#fff7ed;border:1px solid #ffedd5;padding:4px 10px;border-radius:12px;margin-left:8px;animation:ebIn .3s ease}
@keyframes ebIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.eb-ic{color:#f97316;font-size:12px}
.eb-tx{font-size:11px;font-weight:900;color:#9a3412;letter-spacing:0.02em}
.eb-x{border:none;background:#ffedd5;color:#f97316;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:10px;transition:.2s}
.eb-x:hover{background:#fdba74;color:#fff}
.pos-modes{display:flex;gap:4px;padding:2px}
.hdr-cust-zone{display:flex;align-items:center;gap:6px;padding-right:4px;position:relative;min-width:0;overflow:hidden}
.cust-chips{display:flex;gap:6px;align-items:center}
.cust-chip{display:flex;align-items:center;gap:6px;background:rgba(var(--rgb),.05);padding:4px 10px;border-radius:10px;border:1px solid rgba(var(--rgb),.1);animation:cIn .2s ease}
@keyframes cIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
.chip-nm{font-size:11px;font-weight:800;color:#000}
.chip-x{border:none;background:none;color:#94a3b8;cursor:pointer;padding:0;display:flex;align-items:center;transition:.2s}
.chip-x:hover{color:var(--theme)}
.sb-wrap.hdr{background:transparent;border:none;padding:4px 8px;width:100%;max-width:160px}
.hdr-cust-add{width:28px;height:28px;border-radius:8px;border:none;background:transparent;color:#000;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s}
.hdr-cust-add:hover{background:#fff;color:var(--theme);box-shadow:0 2px 8px rgba(0,0,0,0.05)}
.mode-btn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;border:none;background:transparent;color:#000;font:800 10px inherit;cursor:pointer;transition:.2s}
.mode-btn.active{background:#fff;color:var(--theme);box-shadow:0 4px 10px rgba(0,0,0,0.05)}
.mode-tbl{padding:2px 6px;background:var(--theme);color:#fff;border-radius:4px;font-size:9px}
.ctx-bk{width:32px;height:32px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s}
.ctx-bk:hover{border-color:var(--theme);color:var(--theme)}
.hdr-cust-suggestions{position:absolute;top:calc(100% + 8px);left:0;width:240px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 12px 30px rgba(0,0,0,0.1);z-index:200;overflow:hidden;animation:sIn .2s ease}
.pos-search-zone .hdr-cust-suggestions{width:100%}
@keyframes sIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.sugg-item{display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;transition:.2s}
.sugg-item:hover{background:#f8fafc;color:var(--theme)}
.sugg-av{width:28px;height:28px;border-radius:8px;background:rgba(var(--rgb),.1);color:var(--theme);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}
.sugg-info{flex:1}
.sugg-nm{font-size:12px;font-weight:700;color:#000}
.sugg-ph{font-size:9px;color:#94a3b8}
.sugg-ft{padding:10px;border-top:1px solid #f1f5f9;font-size:11px;font-weight:800;color:var(--theme);text-align:center;cursor:pointer}
.sugg-ft:hover{background:#f8fafc}
.sugg-none{padding:12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:600}

.pos-main{display:grid;grid-template-columns:minmax(0,1fr) clamp(320px,31vw,430px);flex:1;min-height:0;overflow:hidden}
.pos-main.full{grid-template-columns:1fr}
.pos-main.no-listing{display:grid;grid-template-columns:minmax(0,1fr) 380px;grid-template-rows:auto minmax(0,1fr);grid-template-areas:"search summary" "body summary";gap:24px;padding:24px;background:#f8fafc;width:100%;}
.pos-main.no-listing .catalog{grid-area:search;width:100%;max-width:none;padding:0;overflow:visible;}
.pos-main.no-listing .cart-panel{display:contents;}
.pos-main.no-listing .cp-hd{display:none;}
.pos-main.no-listing .cp-body{grid-area:body;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:8px;box-shadow:0 4px 10px rgba(0,0,0,0.02);overflow-y:auto;}
.pos-main.no-listing .cp-ft{grid-area:summary;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:24px;box-shadow:0 10px 30px rgba(var(--rgb),0.08);display:flex;flex-direction:column;gap:16px;border-top:none;}
@media(max-width:1024px){
  .pos-main.no-listing{grid-template-columns:1fr;grid-template-rows:auto auto auto;grid-template-areas:"search" "body" "summary";overflow-y:auto;padding:16px;gap:16px;}
  .pos-main.no-listing .cp-body{min-height:30vh;overflow-y:auto;}
}
.catalog{min-width:0;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:16px}
.pos-hdr-c{flex:1 1 320px;display:flex;justify-content:center;min-width:0}
.op-switcher{display:flex;background:#f1f5f9;padding:4px;border-radius:12px;gap:4px;flex-shrink:0;max-width:100%;overflow:auto}
.op-btn{border:none;background:transparent;padding:6px 16px;border-radius:10px;display:flex;align-items:center;gap:8px;font:900 12px inherit;color:#000;cursor:pointer;transition:.2s}
.op-btn.on{background:var(--theme);color:#fff;box-shadow:0 4px 12px rgba(var(--rgb),0.2)}
.op-btn:hover:not(.on){background:rgba(var(--rgb),0.05);color:var(--theme)}

.op-view{flex:1;padding:12px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:12px}
.ov-header{display:flex;justify-content:space-between;align-items:center}
.ov-header h3{font-size:20px;font-weight:900;color:#000}
.ov-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.ov-card{background:#fff;padding:12px;border-radius:12px;border:1.5px solid #f1f5f9;display:flex;flex-direction:column;gap:6px;transition:.3s;cursor:pointer}
.ov-card:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(0,0,0,0.03)}
.ov-card.expanded{grid-column:span 1;border-color:var(--theme);box-shadow:0 20px 40px rgba(var(--rgb),0.1);transform:scale(1.02)}
@media(min-width:900px){ .ov-card.expanded{ grid-column: span 2; } }
.ov-card-hd{display:flex;justify-content:space-between;align-items:flex-start}
.ov-id{font-size:13px;font-weight:900;color:#000}
.ov-st{font-size:9px;font-weight:900;text-transform:uppercase;padding:2px 6px;border-radius:4px;background:#f1f5f9;color:#000}
.ov-st.kitchen{background:#fff7ed;color:#f97316}
.ov-st.confirmed{background:#f0fdf4;color:#16a34a}
.kitchen-filters{display:flex;gap:4px;margin-top:2px}
.k-filter-btn{padding:3px 8px;border-radius:4px;border:1px solid #e2e8f0;background:#fff;font:900 8.5px inherit;color:#94a3b8;cursor:pointer;transition:.2s;text-transform:uppercase;letter-spacing:0.06em;display:flex;align-items:center;gap:4px}
.k-filter-btn::before{content:'';width:4px;height:4px;border-radius:50%;background:#cbd5e1;transition:.2s}
.k-filter-btn.on{background:rgba(var(--rgb), 0.08);color:var(--theme);border-color:rgba(var(--rgb), 0.2);box-shadow:none}
.k-filter-btn.on::before{background:var(--theme);box-shadow:0 0 4px var(--theme)}
.k-filter-btn:hover:not(.on){background:#f8fafc;color:#64748b;border-color:#cbd5e1}
.history-table{width:100%;border-collapse:separate;border-spacing:0}
.history-table th{text-align:left;padding:12px;font-size:12px;color:#000;border-bottom:1px solid #f1f5f9}
.history-table td{padding:16px 12px;font-weight:700;border-bottom:1px solid #f8fafc;color:#000}
.ov-st-pill{font-size:10px;padding:4px 8px;border-radius:6px;background:#f1f5f9;font-weight:900;color:#000}
.sb-wrap.cust{background:#fffaf5;border-color:#fed7aa}
.sb-ic{color:#000}
.sb-in{flex:1;border:none;outline:none;font:700 14px inherit;background:transparent;color:#000}
.sb-x{background:none;border:none;color:#000;cursor:pointer}
.entry-add{width:36px;height:36px;border-radius:10px;border:none;background:var(--theme);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow: 0 4px 10px rgba(var(--rgb), 0.2);}

.cats-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}
.cats-scroll::-webkit-scrollbar{display:none}
.cat-orb{flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:5px 12px;border-radius:12px;background:#fff;border:1px solid #e2e8f0;cursor:pointer;transition:.2s}
.cat-orb.on{background:var(--theme);border-color:var(--theme);color:#fff;box-shadow:0 2px 8px rgba(var(--rgb),.2)}
.cat-orb-t{font-size:11px;font-weight:800;color:#000;text-transform:capitalize}
.cat-orb.on .cat-orb-t{color:#fff}

.prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,95px),1fr));gap:8px;align-content:start}
.pc-card{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;transition:.2s;display:flex;flex-direction:column;box-shadow:0 2px 6px rgba(0,0,0,0.02)}
.pc-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(var(--rgb),0.08);border-color:var(--theme)}
.pc-img-v{aspect-ratio:1.5;background-size:cover;background-position:center;background-color:#f8fafc;border-bottom:1px solid #f8fafc}
.pc-body{padding:6px;display:flex;flex-direction:column;gap:2px;flex:1}
.pc-nm{font-size:9.5px;font-weight:700;color:#000;height:24px;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.pc-pr-row{display:flex;justify-content:space-between;align-items:center;margin-top:auto}
.pc-pr{font-size:11px;font-weight:800;color:#000}
.pos-search-zone{position:relative}
.ps-bar-wrapper{display:flex;align-items:center;background:#fff;border:2px solid #e2e8f0;border-radius:14px;padding:4px 4px 4px 16px;transition:.2s;box-shadow:0 2px 10px rgba(0,0,0,0.02)}
.ps-bar-wrapper:focus-within{border-color:var(--theme);box-shadow:0 0 0 3px rgba(var(--rgb),.15)}
.ps-ic{color:#94a3b8;font-size:14px}
.ps-in{flex:1;border:none;outline:none;background:transparent;padding:10px;font:700 14px inherit;color:#000}
.ps-clear{background:none;border:none;color:#94a3b8;cursor:pointer;padding:8px}
.ps-clear:hover{color:#000}
.ps-add-btn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:var(--theme);color:#fff;border:none;border-radius:10px;cursor:pointer;transition:.2s;box-shadow:0 4px 10px rgba(var(--rgb),.2)}
.ps-add-btn:hover{filter:brightness(1.1);transform:scale(1.05)}
.pc-add{width:22px;height:22px;border-radius:5px;border:none;background:#f8fafc;color:var(--theme);cursor:pointer;transition:.2s;display:flex;align-items:center;justify-content:center;transition:.2s}
.pc-add:hover{background:var(--theme);color:#fff;transform:scale(1.1)}
.pc-add svg{font-size:10px}

.cart-panel{min-width:0;min-height:0;background:#fff;border-left:1px solid rgba(var(--rgb), 0.1);display:flex;flex-direction:column;color:#000;box-shadow:-20px 0 40px rgba(var(--rgb),0.05);z-index:10;}
.cp-hd{padding:16px 24px;border-bottom:1px solid rgba(var(--rgb), 0.08);background:linear-gradient(to bottom, rgba(var(--rgb),0.08), rgba(255,255,255,1));}
.ts-zone{display:flex;flex-direction:column;gap:6px}
.ts-label{display:flex;align-items:center;gap:8px;font:800 10px inherit;color:#000;text-transform:uppercase;opacity:0.5}
.ts-input{border:1px solid #e2e8f0;background:#fff;padding:8px 12px;border-radius:10px;font:700 13px inherit;color:#000;outline:none;cursor:pointer;transition:.2s}
.ts-input:focus{border-color:var(--theme);box-shadow:0 0 0 3px rgba(var(--rgb),.15)}
.ff-selected{margin-top:8px;cursor:pointer}
.ff-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;background:#f8fafc;font:800 11px inherit;color:var(--bc);border:1.5px solid #f1f5f9;transition:.2s}
.ff-badge:hover{border-color:var(--bc);background:#fff}
.pos-modes.single .mode-btn{padding:8px 16px;border-radius:12px;font-weight:900;font-size:12px;color:#000}
.cp-body{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.ci-card{display:flex;gap:10px;padding:8px 12px;border-radius:10px;background:#fff;color:#000;border:1px solid rgba(var(--rgb),0.1);box-shadow:0 2px 6px rgba(0,0,0,0.02);transition:0.3s cubic-bezier(0.4,0,0.2,1);position:relative;overflow:hidden;align-items:center}
.ci-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--theme);opacity:0;transition:0.3s;}
.ci-card:hover{transform:translateX(2px);box-shadow:0 4px 12px rgba(var(--rgb),0.08);border-color:var(--theme);}
.ci-card:hover::before{opacity:1;}
.ci-img{width:36px;height:36px;border-radius:8px;background-size:cover;background-position:center;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.ci-info{flex:1;display:flex;flex-direction:column;justify-content:center}
.ci-nm{font-size:11.5px;font-weight:800;color:#0f172a}
.ci-pr-row{display:flex;justify-content:space-between;align-items:center;margin-top:2px}
.ci-pr{font-size:12.5px;font-weight:900;color:var(--theme)}
.ci-qty{display:flex;align-items:center;gap:6px;background:#f8fafc;padding:3px;border-radius:6px;border:1px solid #e2e8f0}
.ci-q-btn{border:none;background:#fff;color:#0f172a;cursor:pointer;width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:0.2s;box-shadow:0 1px 2px rgba(0,0,0,0.05);font-size:10px;}
.ci-q-btn:hover{background:var(--theme);color:#fff}
.ci-q-val{font-size:11px;font-weight:800;color:#0f172a;min-width:14px;text-align:center}
.cp-ft{padding:16px;background:linear-gradient(to top, rgba(var(--rgb),0.03), #fff);border-top:1px solid rgba(var(--rgb),0.1);display:flex;flex-direction:column;gap:12px;box-shadow:0 -10px 30px rgba(0,0,0,0.02)}
.cp-summary{display:flex;flex-direction:column;gap:6px;padding:12px 16px;background:#f8fafc;border-radius:12px;border:1px solid rgba(var(--rgb),0.1)}
.cp-row{display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#64748b}
.ov-time{font-size:11px;font-weight:700;color:#64748b}
.cp-row.tot{font-size:22px;font-weight:900;color:var(--theme);margin-top:6px;padding-top:8px;border-top:2px dashed rgba(var(--rgb),0.2);align-items:center}
.cp-main-act{padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg, var(--theme), rgba(var(--rgb),0.7));color:#fff;font:900 15px inherit;cursor:pointer;box-shadow:0 8px 20px rgba(var(--rgb),0.3);transition:0.3s;position:relative;overflow:hidden;}
.cp-main-act::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);transform:skewX(-20deg);transition:0s;}
.cp-main-act:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(var(--rgb),0.4)}
.cp-main-act:hover::after{left:200%;transition:0.7s ease-in-out;}
.disc-add-link{background:none;border:none;color:var(--theme);font:700 12px inherit;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;transition:0.2s}
.disc-add-link:hover{opacity:0.8;color:var(--theme)}
.disc-edit-link{background:none;border:none;cursor:pointer;padding:0;font:600 10px inherit;color:#94a3b8;text-decoration:underline;text-underline-offset:2px;transition:0.2s}
.disc-edit-link:hover{color:#64748b}
.disc-tabs{display:flex;border-bottom:2px solid #f1f5f9;background:#fafbfc}
.disc-tab{flex:1;padding:14px;border:none;background:transparent;font:800 12px inherit;color:#94a3b8;cursor:pointer;transition:0.2s;position:relative;text-transform:uppercase;letter-spacing:0.5px}
.disc-tab.on{color:var(--theme)}
.disc-tab.on::after{content:'';position:absolute;bottom:-2px;left:16px;right:16px;height:3px;background:var(--theme);border-radius:3px 3px 0 0}
.disc-line-list{max-height:320px;overflow-y:auto;padding:8px 0}
.disc-line-item{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-bottom:1px solid #f8fafc;transition:0.15s}
.disc-line-item:hover{background:#fafbfc}
.disc-line-info{flex:1;min-width:0}
.disc-line-nm{font-size:13px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.disc-line-meta{font-size:11px;color:#94a3b8;font-weight:600;margin-top:2px}
.disc-line-input-wrap{display:flex;align-items:center;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 10px;transition:0.2s;width:110px;flex-shrink:0}
.disc-line-input-wrap:focus-within{border-color:var(--theme);box-shadow:0 0 0 3px rgba(var(--rgb),0.1)}
.disc-line-sym{font-size:12px;font-weight:800;color:#94a3b8;margin-right:4px}
.disc-line-input{border:none;outline:none;background:transparent;font:700 13px inherit;color:#0f172a;width:100%;padding:8px 0;text-align:right}
.disc-line-input::placeholder{color:#cbd5e1}
.disc-type-row{display:flex;gap:8px}
.dt-chip{flex:1;padding:10px 16px;border-radius:12px;border:2px solid #f1f5f9;background:#fff;font:700 12px inherit;color:#64748b;cursor:pointer;transition:0.2s;text-align:center}
.dt-chip.on{border-color:var(--theme);background:rgba(var(--rgb),0.05);color:var(--theme)}
.dt-chip:hover:not(.on){border-color:#cbd5e1}
.disc-clear-link{background:none;border:none;color:#ef4444;font:600 12px inherit;cursor:pointer;padding:0;text-align:left;transition:0.2s}
.disc-clear-link:hover{text-decoration:underline}

.vm-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;animation:vmo .3s ease}
@keyframes vmo{from{opacity:0}to{opacity:1}}
.vm-modal{background:#ffffff;border-radius:28px;width:100%;max-width:820px;height:82vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,0.2);font-family:'Plus Jakarta Sans',sans-serif;animation:vms .4s cubic-bezier(0.16,1,0.3,1); border: 1px solid #e2e8f0; border-top: 3px solid #f97316;}
@keyframes vms{from{transform:translateY(20px) scale(0.95);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
.vm-body{flex:1;overflow:hidden;display:flex;flex-direction:column;background:#f8fafc}
.vm-top-strip{padding:16px 20px;display:flex;justify-content:space-between;align-items:center;background:#fff;border-bottom:1px solid #f1f5f9}
.vm-modes-row{display:flex;gap:8px;background:#f1f5f9;padding:4px;border-radius:14px}
.vm-m-btn{padding:6px 14px;border-radius:8px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;gap:6px;font:600 10px inherit;color:#94a3b8;transition:.2s}
.vm-m-btn:hover{color:#64748b}
.vm-m-btn.on{background:#fff;color:var(--m-clr);box-shadow:0 3px 10px rgba(0,0,0,0.05)}
.vm-m-ic{font-size:11px}
.vm-top-x{background:#f1f5f9;border:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#94a3b8;cursor:pointer;transition:.2s}
.vm-top-x:hover{background:#e2e8f0;color:#1e293b}

.vm-ctrl-strip{padding:12px 20px;background:#fff;border-bottom:1px solid #f1f5f9;display:flex;flex-direction:column;gap:12px}
.vm-f-scroller{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
.vm-f-btn{padding:5px 12px;border-radius:10px;border:1px solid #f1f5f9;background:#fff;font:600 9px inherit;cursor:pointer;color:#94a3b8;white-space:nowrap;transition:.2s}
.vm-f-btn.on{background:#0f172a;color:#fff;border-color:#0f172a;box-shadow:0 3px 8px rgba(0,0,0,0.06)}

.vm-leg-scroller{display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;padding:2px 0}
.vm-leg-i{display:flex;align-items:center;gap:4px;font:600 7.2px inherit;color:#94a3b8;white-space:nowrap;letter-spacing:0.02em}
.vm-dot{width:6px;height:6px;border-radius:50%}
.vm-dot.av{background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.4)}
.vm-dot.occ{background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,0.4)}
.vm-dot.bld{background:#06b6d4;box-shadow:0 0 8px rgba(6,182,212,0.4)}
.vm-dot.res{background:#6366f1;box-shadow:0 0 8px rgba(99,102,241,0.4)}
.vm-dot.cln{background:#f59e0b;box-shadow:0 0 8px rgba(245,158,11,0.4)}
.vm-dot.mnt{background:#64748b;box-shadow:0 0 8px rgba(100,116,139,0.4)}

.vm-graph{flex:1;overflow:auto;padding:20px;background-color:#fcfdfe;background-image:radial-gradient(#e2e8f0 1px,transparent 0);background-size:24px 24px;position:relative}
.vm-floating-leg{position:fixed;bottom:24px;right:24px;background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);padding:8px 16px;border-radius:100px;display:flex;gap:16px;box-shadow:0 10px 25px rgba(0,0,0,0.08);border:1px solid #e2e8f0;z-index:100}
.vm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(85px,1fr));gap:12px;justify-content:start}
.vm-node{width:100%;aspect-ratio:1.1;border-radius:18px;border:none;background:#ffffff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:.2s ease;color:#0f172a;position:relative;padding:8px;box-shadow:0 4px 10px rgba(0,0,0,0.03)}
.vm-node:hover{transform:translateY(-3px);box-shadow:0 8px 16px rgba(0,0,0,0.06)}
.vm-node.av{background:linear-gradient(135deg,#ffffff,#f0fdf4);border:1px solid rgba(16,185,129,0.1)}
.vm-node.av .vm-node-n{color:#15803d}
.vm-node.av .vm-node-s{color:#16a34a;opacity:0.7}
.vm-node.occ{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 10px 24px rgba(239,68,68,0.3)}
.vm-node.occ .vm-node-n,.vm-node.occ .vm-node-s{color:#fff}
.vm-node.bld{background:linear-gradient(135deg,#ffffff,#ecfeff);border:1px solid rgba(6,182,212,0.1);color:#0891b2}
.vm-node.res{background:linear-gradient(135deg,#ffffff,#eef2ff);border:1px solid rgba(99,102,241,0.1);color:#4f46e5}
.vm-node.cln{background:linear-gradient(135deg,#ffffff,#fffbeb);border:1px solid rgba(245,158,11,0.1);color:#d97706}
.vm-node.mnt{background:linear-gradient(135deg,#ffffff,#f1f5f9);border:1px solid rgba(100,116,139,0.1);color:#475569}

.vm-node-n{font-size:16px;font-weight:900;letter-spacing:-0.02em}
.vm-node-s{font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px;margin-top:6px;opacity:0.8}
.vm-pulse{position:absolute;inset:-3px;border:2px solid #ef4444;border-radius:inherit;animation:vmp 2s infinite}
@keyframes vmp{0%{transform:scale(1);opacity:0.3}100%{transform:scale(1.1);opacity:0}}

.vm-ft{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;background:#fff}
.vm-skip{border:none;background:#f1f5f9;color:#64748b;font:800 12px inherit;cursor:pointer;padding:10px 20px;border-radius:12px;transition:.2s}
.vm-skip:hover{background:#e2e8f0;color:#1e293b}

@media(max-width:1400px){
  .pos-main{grid-template-columns:minmax(0,1fr) clamp(300px,34vw,390px)}
}
@media(max-width:1200px){
  .sb-wrap.hdr{max-width:120px}
  .op-btn span{display:none}
  .op-btn{padding:8px 12px}
}
@media(max-width:1024px){
  .pos-container{min-height:100dvh;height:auto}
  .pos-main{display:flex;flex-direction:column;overflow:visible}
  .catalog{overflow:visible;flex:none}
  .cart-panel{border-left:none;border-top:1px solid #e2e8f0;box-shadow:0 -18px 36px rgba(var(--rgb),0.08)}
  .cp-body{max-height:40vh}
  .pos-hdr-l,.pos-hdr-r{flex:1 1 auto}
  .pos-hdr-c{order:3;flex:1 1 100%;justify-content:flex-start}
  .op-switcher{width:100%;justify-content:flex-start}
}
@media(max-width:900px){
  .mobile-hide{display:none}
  .pos-hdr{flex-wrap:wrap;padding:10px 16px;gap:10px}
  .pos-hdr-l{flex:1;min-width:0;order:1}
  .pos-hdr-c{flex-basis:100%;order:3;justify-content:center;padding-top:4px}
  .pos-hdr-r{order:2;flex:1 1 100%;justify-content:space-between;flex-wrap:wrap}
  .pos-hdr-controls{width:100%;overflow:visible}
  .hdr-context-group{flex-wrap:wrap;gap:4px;background:transparent;border:none;width:100%;padding:0}
  .hdr-cust-zone{flex:1 1 220px;overflow:visible}
  .sb-wrap.hdr{max-width:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px}
  .cust-chips{flex-wrap:wrap;gap:4px}
  .om-toggle{flex:1 1 auto}
  .op-switcher{width:100%;justify-content:center;background:#fff;border:1px solid #e2e8f0}
  .op-btn{flex:1;justify-content:center;padding:10px}
  .op-btn span{display:inline;font-size:11px}
}
@media(max-width:600px){
  .pos-container{min-height:100dvh}
  .pos-hdr{padding:8px 12px;gap:10px;align-items:stretch}
  .pos-hdr-l,.pos-hdr-r,.pos-hdr-c{width:100%}
  .pos-hdr-l{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:start}
  .pos-hdr-controls{min-width:0}
  .hdr-context-group{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:start;padding:0}
  .pos-modes.single{padding:0}
  .pos-modes.single .mode-btn{padding:6px 8px;font-size:10px;border-radius:8px}
  .mode-lb{display:none}
  .sb-wrap.hdr{max-width:none;padding:2px 4px;min-width:0}
  .sb-in{font-size:12px;padding:4px}
  .hdr-divider{display:none}
  .hdr-cust-zone{width:100%;min-width:0;display:flex;flex-direction:column;align-items:stretch}
  .cust-chips{width:100%}
  .hdr-cust-suggestions{width:min(100%,320px)}
  .pos-hdr-c{order:2;padding-top:0}
  .pos-hdr-r{order:3;display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center}
  .om-toggle{min-width:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:2px}
  .op-switcher{justify-content:flex-start}
  .op-btn{padding:8px 4px;gap:4px}
  .op-btn span{font-size:10px}
  .ctx-bk{width:30px;height:30px;border-radius:8px}
  .om-toggle .mode-btn{padding:6px;font-size:0;gap:0} /* Hide text in mode buttons on tiny screens */
  .cust-chip{padding:2px 6px;border-radius:6px}
  .chip-nm{font-size:9px}
  .prod-grid{gap:8px}
  .catalog{padding:12px}
  .cart-panel{border-radius:18px 18px 0 0}
  .cp-ft{padding:12px}
  .cp-summary{padding:10px}
  .cp-row.tot{font-size:18px;padding-top:6px}
  .cp-main-act{padding:12px;font-size:14px}
  .ci-card{padding:10px;gap:10px}
  .ci-nm{font-size:12px}
  .ci-pr{font-size:12px}
  .ci-pr-row{align-items:flex-start;flex-direction:column;gap:10px}
  .ci-qty{width:100%;justify-content:space-between}
  .ps-bar-wrapper{padding:2px 2px 2px 12px}
  .ps-in{padding:8px;font-size:13px}
  .ps-add-btn{width:30px;height:30px}
  .cp-body{max-height:none}
}
@media(max-width:420px){
  .cp-hd{padding:14px 16px}
  .cp-body{padding:14px}
  .cp-ft{padding:14px}
  .cp-row.tot{font-size:16px}
}
`;

const SETUP_CSS = ``;
const MODAL_CSS = ``;
