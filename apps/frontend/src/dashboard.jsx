import React, { useState, useEffect } from 'react';
import './dashboard.css';

export default function Dashboard({ onNavigateToHome }) {
  // Navigation & View State
  const [activeView, setActiveView] = useState('dashboardView');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Activity Logs'

  // Data States (Fresh for new dynamic entries)
  const [customers, setCustomers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [followups, setFollowups] = useState([]);

  // Selected & Target Indices
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(null);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

  // Global Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Active Modal State: null | 'addCustomer' | 'addInteraction' | 'addFollowUp' | 'editCustomer' | 'confirmDelete'
  const [activeModal, setActiveModal] = useState(null);

  // Form States
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'QUALIFIED',
    notes: ''
  });

  const [editCustomerForm, setEditCustomerForm] = useState({
    index: null,
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'ACTIVE',
    notes: ''
  });

  const [interactionForm, setInteractionForm] = useState({
    custIndex: '',
    type: 'Phone Call',
    notes: ''
  });

  const [followupForm, setFollowupForm] = useState({
    custIndex: '',
    title: '',
    dueDate: ''
  });

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    title: '',
    message: '',
    variant: 'success' // 'success' | 'danger' | 'info'
  });

  // Toast Timer
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (title, message, variant = 'success') => {
    setToast({
      show: true,
      title,
      message,
      variant
    });
  };

  // Helper Functions
  const getInitials = (name) => {
    if (!name) return '--';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'INACTIVE':
        return 'badge-inactive';
      case 'PENDING':
        return 'badge-pending';
      case 'COMPLETED':
        return 'badge-completed';
      case 'QUALIFIED':
      case 'ACTIVE':
      default:
        return 'badge-active';
    }
  };

  // View Navigation
  const handleSwitchView = (viewId) => {
    setActiveView(viewId);
    setMobileSidebarOpen(false);
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboardView':
        return 'Dashboard Overview';
      case 'customersView':
        return 'Customer Directory';
      case 'customerDetailsView':
        return 'Customer Details';
      case 'interactionsView':
        return 'Interactions Log';
      case 'reportsView':
        return 'Reports & Analytics';
      case 'settingsView':
        return 'System Settings';
      default:
        return 'Dashboard Overview';
    }
  };

  // Modal Triggers
  const openModal = (modalName, defaultCustIndex = '') => {
    if (modalName === 'addInteraction') {
      setInteractionForm({
        custIndex: defaultCustIndex !== '' ? defaultCustIndex : (currentCustomerIndex !== null ? String(currentCustomerIndex) : (customers.length > 0 ? '0' : '')),
        type: 'Phone Call',
        notes: ''
      });
    } else if (modalName === 'addFollowUp') {
      setFollowupForm({
        custIndex: defaultCustIndex !== '' ? defaultCustIndex : (currentCustomerIndex !== null ? String(currentCustomerIndex) : (customers.length > 0 ? '0' : '')),
        title: '',
        dueDate: ''
      });
    }
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // 1. ADD CUSTOMER
  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    const newCust = {
      name: customerForm.name.trim(),
      email: customerForm.email.trim(),
      phone: customerForm.phone.trim(),
      company: customerForm.company.trim(),
      status: customerForm.status,
      notes: customerForm.notes.trim(),
      added: new Date().toLocaleDateString()
    };

    setCustomers(prev => [...prev, newCust]);
    showToast('Customer Added', `${newCust.name} successfully added to database.`, 'success');
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'QUALIFIED',
      notes: ''
    });
    closeModal();
  };

  // 2. VIEW CUSTOMER DETAILS
  const handleViewCustomer = (idx) => {
    setCurrentCustomerIndex(idx);
    setActiveView('customerDetailsView');
  };

  // 3. EDIT CUSTOMER
  const handleOpenEditCustomer = (idx) => {
    const c = customers[idx];
    if (!c) return;
    setEditCustomerForm({
      index: idx,
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      company: c.company || '',
      status: c.status || 'ACTIVE',
      notes: c.notes || ''
    });
    setActiveModal('editCustomer');
  };

  const handleEditCustomerSubmit = (e) => {
    e.preventDefault();
    const idx = editCustomerForm.index;
    if (idx === null || !customers[idx]) return;

    setCustomers(prev => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        name: editCustomerForm.name.trim(),
        email: editCustomerForm.email.trim(),
        phone: editCustomerForm.phone.trim(),
        company: editCustomerForm.company.trim(),
        status: editCustomerForm.status,
        notes: editCustomerForm.notes.trim()
      };
      return updated;
    });

    closeModal();
    showToast('Record Updated', 'Changes were saved successfully.', 'success');
  };

  // 4. DELETE CUSTOMER (In-App Dialog)
  const handlePromptDelete = (idx) => {
    setPendingDeleteIndex(idx);
    setActiveModal('confirmDelete');
  };

  const handleExecuteDelete = () => {
    if (pendingDeleteIndex === null || !customers[pendingDeleteIndex]) {
      closeModal();
      return;
    }
    const deletedName = customers[pendingDeleteIndex].name;
    setCustomers(prev => prev.filter((_, i) => i !== pendingDeleteIndex));

    if (currentCustomerIndex === pendingDeleteIndex) {
      setCurrentCustomerIndex(null);
      setActiveView('customersView');
    } else if (currentCustomerIndex !== null && currentCustomerIndex > pendingDeleteIndex) {
      setCurrentCustomerIndex(prev => prev - 1);
    }

    setPendingDeleteIndex(null);
    closeModal();
    showToast('Record Deleted', `${deletedName} was removed from the database.`, 'danger');
  };

  // 5. LOG INTERACTION
  const handleInteractionSubmit = (e) => {
    e.preventDefault();
    const idx = parseInt(interactionForm.custIndex, 10);
    const custName = customers[idx] ? customers[idx].name : 'Customer';

    const newInteraction = {
      customerName: custName,
      type: interactionForm.type,
      notes: interactionForm.notes.trim(),
      time: 'Just now'
    };

    setInteractions(prev => [newInteraction, ...prev]);
    showToast('Saved to History', `Activity recorded for ${custName}.`, 'success');
    closeModal();
  };

  // 6. CREATE FOLLOW-UP
  const handleFollowupSubmit = (e) => {
    e.preventDefault();
    const idx = parseInt(followupForm.custIndex, 10);
    const custName = customers[idx] ? customers[idx].name : 'Client';

    const newFollowup = {
      title: followupForm.title.trim(),
      client: custName,
      dueDate: followupForm.dueDate,
      status: 'PENDING'
    };

    setFollowups(prev => [newFollowup, ...prev]);
    showToast('Task Created', `Follow-up set for ${custName}.`, 'success');
    closeModal();
  };

  // 7. COMPLETE FOLLOW-UP
  const handleCompleteFollowup = (idx) => {
    if (!followups[idx]) return;
    setFollowups(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], status: 'COMPLETED' };
      return updated;
    });
    showToast('Status: Completed', `Task "${followups[idx].title}" marked as complete.`, 'success');
  };

  // Filtered Lists by Search Query
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingFollowupsCount = followups.filter(f => f.status === 'PENDING').length;
  const currentCustomer = currentCustomerIndex !== null ? customers[currentCustomerIndex] : null;
  const currentCustomerInteractions = currentCustomer
    ? interactions.filter(it => it.customerName === currentCustomer.name)
    : [];

  return (
    <div className="dash-layout">
      {/* ==========================================
          LEFT SIDEBAR NAVIGATION
          ========================================== */}
      <aside className={`dash-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`} id="dashSidebar">
        <div className="sidebar-header">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateToHome) onNavigateToHome();
            }}
            className="logo"
          >
            <span className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#253880" />
                <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="logo-text">TS-CRM</span>
          </a>
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close Navigation Sidebar"
          >
            &times;
          </button>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeView === 'dashboardView' ? 'active' : ''}`}
            onClick={() => handleSwitchView('dashboardView')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            className={`menu-item ${activeView === 'customersView' || activeView === 'customerDetailsView' ? 'active' : ''}`}
            onClick={() => handleSwitchView('customersView')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Customers</span>
          </button>

          <button
            className={`menu-item ${activeView === 'interactionsView' ? 'active' : ''}`}
            onClick={() => handleSwitchView('interactionsView')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Interactions</span>
          </button>

          <div className="menu-section-label">OPERATIONS</div>

          <button
            className={`menu-item ${activeView === 'reportsView' ? 'active' : ''}`}
            onClick={() => handleSwitchView('reportsView')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Reports</span>
          </button>

          <button
            className={`menu-item ${activeView === 'settingsView' ? 'active' : ''}`}
            onClick={() => handleSwitchView('settingsView')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-user-footer">
          <div className="user-avatar" id="sidebarAvatar">AU</div>
          <div className="user-info">
            <strong className="user-name" id="sidebarUserName">Account User</strong>
            <span className="user-role">BUSINESS USER</span>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'active' : ''}`}
        id="sidebarBackdrop"
        onClick={() => setMobileSidebarOpen(false)}
      ></div>

      {/* ==========================================
          RIGHT MAIN WORKSPACE
          ========================================== */}
      <main className="dash-main-content">
        <header className="dash-topbar">
          <div className="topbar-left">
            <button
              className="dash-menu-toggle"
              id="dashMenuToggle"
              aria-label="Open Navigation Menu"
              onClick={() => setMobileSidebarOpen(prev => !prev)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="topbar-title" id="pageTitle">
              {getPageTitle()}
            </h1>
          </div>

          <div className="topbar-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              id="globalSearchInput"
              placeholder="Search customers or follow-ups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="topbar-right">
            <button className="icon-button notification-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <div className="profile-chip">
              <div className="user-avatar-placeholder">U</div>
              <div className="profile-details">
                <span className="name" id="topbarUserName">Active User</span>
                <span className="role text-blue">ONLINE</span>
              </div>
            </div>
          </div>
        </header>

        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {activeView === 'dashboardView' && (
          <div className="dash-view active" id="dashboardView">
            <div className="action-header">
              <h2 className="section-heading">Performance Summary</h2>
              <div className="action-buttons-group">
                <button className="btn-primary" onClick={() => openModal('addCustomer')}>
                  + Add Customer
                </button>
                <button className="btn-dark" onClick={() => openModal('addFollowUp')}>
                  📅 Create Follow-up
                </button>
              </div>
            </div>

            <div className="kpi-cards-grid">
              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon icon-blue-tint">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#253880" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="badge badge-green">Live</span>
                </div>
                <span className="kpi-label">TOTAL CUSTOMERS</span>
                <div className="kpi-number">{customers.length}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon icon-orange-tint">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B7791F" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <span className="badge badge-orange">Pending</span>
                </div>
                <span className="kpi-label">FOLLOW-UPS</span>
                <div className="kpi-number">{pendingFollowupsCount}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="kpi-icon icon-blue-tint">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#253880" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span className="badge badge-blue">Activity</span>
                </div>
                <span className="kpi-label">INTERACTIONS</span>
                <div className="kpi-number">{interactions.length}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <div className="avatar-group-stack">
                    <span className="avatar-more">CRM</span>
                  </div>
                </div>
                <span className="kpi-label">SYSTEM STATUS</span>
                <div className="kpi-number" style={{ fontSize: '1rem', marginTop: '6px' }}>
                  Ready for Data
                </div>
              </div>
            </div>

            <div className="dash-grid-layout">
              <div className="card-box">
                <div className="card-box-header">
                  <h3 className="card-box-title">Recent Interactions</h3>
                  <button className="btn-link" onClick={() => handleSwitchView('interactionsView')}>
                    VIEW ALL ACTIVITIES
                  </button>
                </div>

                <div id="dashInteractionsContainer">
                  {interactions.length > 0 ? (
                    <div className="table-responsive">
                      <table className="crm-data-table">
                        <thead>
                          <tr>
                            <th>CUSTOMER</th>
                            <th>TYPE</th>
                            <th>TIME</th>
                            <th>NOTES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {interactions.slice(0, 5).map((item, idx) => (
                            <tr key={idx}>
                              <td><strong>{item.customerName}</strong></td>
                              <td><span className="badge badge-blue">{item.type}</span></td>
                              <td>{item.time}</td>
                              <td>{item.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state-mini">
                      <p className="subtext">No interactions logged yet. Click "+ Log Interaction" to record customer activity.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-box">
                <div className="card-box-header">
                  <h3 className="card-box-title">Follow-ups</h3>
                  <button className="icon-button" onClick={() => openModal('addFollowUp')} title="Create Follow-up">
                    ⌛
                  </button>
                </div>

                <div className="followups-stack">
                  {followups.length > 0 ? (
                    followups.map((f, idx) => {
                      const isPending = f.status === 'PENDING';
                      return (
                        <div
                          key={idx}
                          className="followup-card"
                          style={{
                            padding: '12px',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            marginBottom: '10px'
                          }}
                        >
                          <div
                            className="followup-card-top"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '6px'
                            }}
                          >
                            <div>
                              <strong style={{ display: 'block', fontName: '0.9rem' }}>{f.title}</strong>
                              <span className="subtext">
                                Client: {f.client} • Due: {f.dueDate}
                              </span>
                            </div>
                            <div>
                              {isPending ? (
                                <span className="badge badge-pending">⌛ PENDING</span>
                              ) : (
                                <span className="badge badge-completed">✓ COMPLETED</span>
                              )}
                            </div>
                          </div>
                          <div style={{ marginTop: '8px', textAlign: 'right' }}>
                            {isPending ? (
                              <button
                                className="btn-sm btn-ghost"
                                onClick={() => handleCompleteFollowup(idx)}
                                title="Mark task as complete"
                              >
                                ✓ Mark Done
                              </button>
                            ) : (
                              <span className="subtext" style={{ color: 'var(--color-success-green)', fontWeight: 600 }}>
                                Finished
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state-mini">
                      <p className="subtext">No pending follow-ups. Click "+ ADD TASK" to create one.</p>
                    </div>
                  )}
                </div>

                <button className="btn-dashed-add" onClick={() => openModal('addFollowUp')}>
                  + ADD TASK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CUSTOMERS MANAGEMENT VIEW */}
        {activeView === 'customersView' && (
          <div className="dash-view active" id="customersView">
            <div className="action-header">
              <div>
                <h2 className="section-heading">Customer Directory</h2>
                <p className="subtext">Manage customer records and information.</p>
              </div>
              <div className="action-buttons-group">
                <button className="btn-primary" onClick={() => openModal('addCustomer')}>
                  + Add Customer
                </button>
              </div>
            </div>

            <div className="card-box" id="customerTableContainer">
              {filteredCustomers.length > 0 ? (
                <div className="table-responsive">
                  <table className="crm-data-table">
                    <thead>
                      <tr>
                        <th>CUSTOMER NAME</th>
                        <th>COMPANY</th>
                        <th>STATUS</th>
                        <th>CONTACT</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((c, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="table-user-cell">
                              <div className="avatar-circle avatar-blue">{getInitials(c.name)}</div>
                              <div>
                                <strong>{c.name}</strong>
                                <span className="subtext">{c.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>{c.company || 'N/A'}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(c.status)}`}>{c.status}</span>
                          </td>
                          <td>{c.phone || c.email}</td>
                          <td>
                            <div className="action-buttons-cell">
                              <button className="btn-sm btn-ghost" onClick={() => handleViewCustomer(idx)}>
                                View Profile
                              </button>
                              <button className="btn-sm btn-secondary" onClick={() => handleOpenEditCustomer(idx)}>
                                Edit
                              </button>
                              <button className="btn-sm btn-delete" onClick={() => handlePromptDelete(idx)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-box" style={{ display: 'block' }}>
                  <div className="empty-icon-box">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="empty-title">
                    {searchQuery ? 'No Matching Customers' : 'No Customers Found'}
                  </h3>
                  <p className="empty-text">
                    {searchQuery
                      ? 'No customer records matched your search query.'
                      : 'Your database is currently empty. Start by adding your first business contact.'}
                  </p>
                  <button className="btn-primary" onClick={() => openModal('addCustomer')}>
                    + Add Customer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: CUSTOMER DETAILS VIEW */}
        {activeView === 'customerDetailsView' && currentCustomer && (
          <div className="dash-view active" id="customerDetailsView">
            <div className="breadcrumbs">
              <span onClick={() => handleSwitchView('dashboardView')} style={{ cursor: 'pointer' }}>
                DASHBOARD
              </span>{' '}
              &gt;{' '}
              <span onClick={() => handleSwitchView('customersView')} style={{ cursor: 'pointer' }}>
                CUSTOMER DIRECTORY
              </span>{' '}
              &gt; <strong>{currentCustomer.name.toUpperCase()}</strong>
            </div>

            <div className="card-box customer-details-card">
              <div className="profile-header-flex">
                <div className="profile-main-info">
                  <div className="avatar-large avatar-blue">{getInitials(currentCustomer.name)}</div>
                  <div>
                    <h2 className="profile-name">{currentCustomer.name}</h2>
                    <span className="profile-company">{currentCustomer.company || 'N/A'}</span>
                    <span className={`badge ${getStatusBadgeClass(currentCustomer.status)}`}>
                      {currentCustomer.status}
                    </span>
                  </div>
                </div>

                <div className="profile-actions-group">
                  <button className="btn-secondary" onClick={() => handleOpenEditCustomer(currentCustomerIndex)}>
                    ✏️ Edit Customer
                  </button>
                  <button className="btn-primary" onClick={() => openModal('addInteraction', currentCustomerIndex)}>
                    + Log Interaction
                  </button>
                  <button className="btn-dark" onClick={() => openModal('addFollowUp', currentCustomerIndex)}>
                    📅 Set Follow-up
                  </button>
                </div>
              </div>

              <div className="contact-details-grid">
                <div>
                  <span className="label">EMAIL ADDRESS</span>
                  <p>{currentCustomer.email}</p>
                </div>
                <div>
                  <span className="label">PHONE NUMBER</span>
                  <p>{currentCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="label">NOTES</span>
                  <p>{currentCustomer.notes || 'No additional notes.'}</p>
                </div>
              </div>
            </div>

            <div className="tabs-container">
              <div className="tabs-header">
                <button
                  className={`tab-btn ${activeTab === 'Overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-btn ${activeTab === 'Activity Logs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('Activity Logs')}
                >
                  Activity Logs ({currentCustomerInteractions.length})
                </button>
              </div>

              <div className="card-box tab-content">
                <h3 className="card-box-title">Interaction History</h3>
                <div className="timeline-list">
                  {currentCustomerInteractions.length > 0 ? (
                    currentCustomerInteractions.map((it, idx) => (
                      <div
                        key={idx}
                        className="timeline-item"
                        style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span className="badge badge-blue">{it.type}</span>
                          <span className="subtext">{it.time}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-body)' }}>{it.notes}</p>
                      </div>
                    ))
                  ) : (
                    <p className="subtext">No logged interactions for this customer yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: INTERACTIONS HISTORY VIEW */}
        {activeView === 'interactionsView' && (
          <div className="dash-view active" id="interactionsView">
            <div className="action-header">
              <div>
                <h2 className="section-heading">Interactions Log</h2>
                <p className="subtext">Timeline of logged phone calls, emails, and notes.</p>
              </div>
              <button className="btn-primary" onClick={() => openModal('addInteraction')}>
                + Record Interaction
              </button>
            </div>

            <div className="card-box">
              {interactions.length > 0 ? (
                <div className="table-responsive">
                  <table className="crm-data-table">
                    <thead>
                      <tr>
                        <th>CUSTOMER</th>
                        <th>TYPE</th>
                        <th>DATE & TIME</th>
                        <th>SUMMARY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interactions.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.customerName}</strong></td>
                          <td><span className="badge badge-blue">{item.type}</span></td>
                          <td>{item.time}</td>
                          <td>{item.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-mini">
                  <p className="subtext">No interactions recorded. Click "+ Record Interaction" to log activity.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: REPORTS VIEW */}
        {activeView === 'reportsView' && (
          <div className="dash-view active" id="reportsView">
            <div className="action-header">
              <h2 className="section-heading">Reports & Analytics</h2>
            </div>
            <div className="card-box">
              <div className="kpi-cards-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                  <span className="kpi-label">QUALIFIED LEADS</span>
                  <div className="kpi-number">
                    {customers.filter(c => c.status === 'QUALIFIED').length}
                  </div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">IN NEGOTIATION</span>
                  <div className="kpi-number">
                    {customers.filter(c => c.status === 'NEGOTIATION').length}
                  </div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">TOTAL LOGGED CALLS</span>
                  <div className="kpi-number">
                    {interactions.filter(i => i.type.includes('Call')).length}
                  </div>
                </div>
              </div>
              <p className="subtext">Pipeline reports will populate dynamically as customer interactions increase.</p>
            </div>
          </div>
        )}

        {/* VIEW 6: SETTINGS VIEW */}
        {activeView === 'settingsView' && (
          <div className="dash-view active" id="settingsView">
            <div className="action-header">
              <h2 className="section-heading">Settings</h2>
            </div>
            <div className="card-box">
              <h3 className="card-box-title" style={{ marginBottom: '16px' }}>Account Preferences</h3>
              <p className="subtext" style={{ marginBottom: '20px' }}>
                Manage user profile credentials, notifications, and backend RESTful API endpoints.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
                <div className="form-group">
                  <label className="form-label">Active Workspace</label>
                  <input type="text" className="form-input" value="Default TS-CRM Workspace" readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Notification Email</label>
                  <input type="email" className="form-input" value="admin@company.com" readOnly />
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => showToast('Settings Saved', 'Default preferences are up to date.', 'info')}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {activeModal === 'addCustomer' && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              &times;
            </button>
            <h2 className="modal-title">Add New Customer</h2>
            <form className="modal-form" onSubmit={handleCustomerSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jane Doe"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="jane@company.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Acme Corp"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lead Status</label>
                <select
                  className="form-input"
                  value={customerForm.status}
                  onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                >
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Customer background..."
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                ></textarea>
              </div>
              <button type="submit" className="btn-primary btn-full">
                Save Customer Record
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'addInteraction' && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              &times;
            </button>
            <h2 className="modal-title">Record Interaction</h2>
            <form className="modal-form" onSubmit={handleInteractionSubmit}>
              <div className="form-group">
                <label className="form-label">Customer *</label>
                <select
                  className="form-input"
                  value={interactionForm.custIndex}
                  onChange={(e) => setInteractionForm({ ...interactionForm, custIndex: e.target.value })}
                  required
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c, idx) => (
                    <option key={idx} value={idx}>
                      {c.name} ({c.company || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Interaction Type *</label>
                <select
                  className="form-input"
                  value={interactionForm.type}
                  onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
                  required
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="Video Call">Video Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Note">Note</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes / Details *</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Summary of discussion..."
                  value={interactionForm.notes}
                  onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn-primary btn-full">
                Log Activity
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'addFollowUp' && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              &times;
            </button>
            <h2 className="modal-title">Create Follow-Up Task</h2>
            <form className="modal-form" onSubmit={handleFollowupSubmit}>
              <div className="form-group">
                <label className="form-label">Customer *</label>
                <select
                  className="form-input"
                  value={followupForm.custIndex}
                  onChange={(e) => setFollowupForm({ ...followupForm, custIndex: e.target.value })}
                  required
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c, idx) => (
                    <option key={idx} value={idx}>
                      {c.name} ({c.company || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Send proposal document"
                  value={followupForm.title}
                  onChange={(e) => setFollowupForm({ ...followupForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={followupForm.dueDate}
                  onChange={(e) => setFollowupForm({ ...followupForm, dueDate: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary btn-full">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'editCustomer' && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              &times;
            </button>
            <h2 className="modal-title">Edit Customer Record</h2>
            <form className="modal-form" onSubmit={handleEditCustomerSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCustomerForm.name}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={editCustomerForm.email}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editCustomerForm.phone}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCustomerForm.company}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lead Status</label>
                <select
                  className="form-input"
                  value={editCustomerForm.status}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={editCustomerForm.notes}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, notes: e.target.value })}
                ></textarea>
              </div>
              <button type="submit" className="btn-primary btn-full">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'confirmDelete' && pendingDeleteIndex !== null && customers[pendingDeleteIndex] && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-box confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-warning-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="confirm-title">Confirm Deletion?</h2>
            <p className="confirm-text">
              Are you sure you want to delete <strong>{customers[pendingDeleteIndex].name}</strong>? This action will permanently remove their records from the directory and cannot be undone.
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn-delete" onClick={handleExecuteDelete}>
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        id="toastNotification"
        className={`toast-notification ${toast.show ? 'show' : ''} ${toast.variant === 'danger' ? 'toast-danger' : toast.variant === 'info' ? 'toast-info' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div className="toast-icon-box" id="toastIcon">
          {toast.variant === 'danger' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : toast.variant === 'info' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div className="toast-text-box">
          <div className="toast-title" id="toastTitle">{toast.title}</div>
          <div className="toast-message" id="toastMessage">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}
