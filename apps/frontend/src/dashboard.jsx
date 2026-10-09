import { useCallback, useEffect, useState } from 'react';
import './dashboard.css';
import './crm.css';
import { api } from './api.js';

const blankCustomer = { name: '', email: '', phone: '', company: '', status: 'ACTIVE', notes: '' };
const blankInteraction = { type: 'PHONE_CALL', description: '', date: '' };
const blankFollowUp = { title: '', description: '', dueAt: '' };
const dateText = value => value ? new Date(value).toLocaleString() : '—';
const iso = value => value ? new Date(value).toISOString() : undefined;

function FormField({ label, children }) { return <label className="crm-field"><span>{label}</span>{children}</label>; }
function Modal({ title, children, onClose }) { return <div className="modal-overlay" style={{ display: 'flex' }} onMouseDown={onClose}><section className="modal-box" onMouseDown={e => e.stopPropagation()}><button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button><h2 className="modal-title">{title}</h2>{children}</section></div>; }

export default function Dashboard({ user, onLogout, onNavigateToHome }) {
  const [view, setView] = useState('overview');
  const [customers, setCustomers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selected, setSelected] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [customerForm, setCustomerForm] = useState(blankCustomer);
  const [interactionForm, setInteractionForm] = useState(blankInteraction);
  const [followUpForm, setFollowUpForm] = useState(blankFollowUp);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const admin = user?.role === 'ADMIN';

  const loadOverview = useCallback(async () => {
    setLoading(true); setError('');
    try { const [list, summary] = await Promise.all([api.customers(search), api.dashboard()]); setCustomers(Array.isArray(list) ? list : list.data || []); setDashboard(summary); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [search]);
  useEffect(() => { const id = setTimeout(loadOverview, search ? 300 : 0); return () => clearTimeout(id); }, [loadOverview, search]);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(id); }, [notice]);
  useEffect(() => {
    const closeOnEscape = event => { if (event.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const openCustomer = async (customer) => {
    setSelected(customer); setView('customer'); setDetailLoading(true); setError('');
    try { const [i, f] = await Promise.all([api.interactions(customer.id), api.followUps(customer.id)]); setInteractions(Array.isArray(i) ? i : i.data || []); setFollowUps(Array.isArray(f) ? f : f.data || []); }
    catch (err) { setError(err.message); } finally { setDetailLoading(false); }
  };
  const refreshDetail = async () => { if (selected) await openCustomer(selected); };
  const saveCustomer = async e => { e.preventDefault(); setSaving(true); setError(''); try { const data = modal === 'edit-customer' ? await api.updateCustomer(selected.id, customerForm) : await api.createCustomer(customerForm); setModal(null); setCustomerForm(blankCustomer); setNotice(modal === 'edit-customer' ? 'Customer updated.' : 'Customer added.'); await loadOverview(); if (modal === 'edit-customer') await openCustomer(data); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const saveInteraction = async e => { e.preventDefault(); setSaving(true); try { await (modal === 'edit-interaction' ? api.updateInteraction(interactionForm.id, { type: interactionForm.type, description: interactionForm.description, ...(interactionForm.date ? { date: iso(interactionForm.date) } : {}) }) : api.createInteraction(selected.id, { type: interactionForm.type, description: interactionForm.description, ...(interactionForm.date ? { date: iso(interactionForm.date) } : {}) })); setModal(null); setNotice('Interaction saved.'); await refreshDetail(); await loadOverview(); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const saveFollowUp = async e => { e.preventDefault(); setSaving(true); try { await (modal === 'edit-followup' ? api.updateFollowUp(followUpForm.id, { title: followUpForm.title, description: followUpForm.description, dueAt: iso(followUpForm.dueAt) }) : api.createFollowUp(selected.id, { title: followUpForm.title, description: followUpForm.description, dueAt: iso(followUpForm.dueAt) })); setModal(null); setNotice('Follow-up saved.'); await refreshDetail(); await loadOverview(); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const destroy = async (kind, item) => { if (!admin) return setError('Only an administrator can delete CRM records.'); if (!window.confirm(`Delete this ${kind}? This cannot be undone.`)) return; try { if (kind === 'customer') { await api.deleteCustomer(item.id); setSelected(null); setView('customers'); await loadOverview(); } if (kind === 'interaction') { await api.deleteInteraction(item.id); await refreshDetail(); await loadOverview(); } if (kind === 'follow-up') { await api.deleteFollowUp(item.id); await refreshDetail(); await loadOverview(); } setNotice(`${kind[0].toUpperCase() + kind.slice(1)} deleted.`); } catch (err) { setError(err.message); } };
  const complete = async item => { try { await api.completeFollowUp(item.id); setNotice('Follow-up marked complete.'); await refreshDetail(); await loadOverview(); } catch (err) { setError(err.message); } };
  const logout = async () => { try { await api.logout(); } catch { /* local logout still protects the session */ } onLogout(); };
  const closeDrawer = () => setSidebarOpen(false);
  const showCustomers = () => { setView('customers'); setSelected(null); closeDrawer(); };
  const showOverview = () => { setView('overview'); closeDrawer(); };

  return <div className={`crm-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`dash-sidebar ${sidebarOpen ? 'mobile-open' : ''}`} aria-label="CRM navigation"><div className="sidebar-logo"><button onClick={onNavigateToHome} className="crm-brand" aria-label="Go to TS-CRM home">✓ <span>TS-CRM</span></button><button className="crm-sidebar-close" type="button" onClick={closeDrawer} aria-label="Close navigation">×</button></div><nav className="sidebar-nav">
      <button className={`menu-item ${view === 'overview' ? 'active' : ''}`} onClick={showOverview}><span className="nav-icon">⌂</span><span className="nav-label">Overview</span></button>
      <button className={`menu-item ${view === 'customers' || view === 'customer' ? 'active' : ''}`} onClick={showCustomers}><span className="nav-icon">♙</span><span className="nav-label">Customers</span></button>
    </nav><div className="sidebar-bottom"><span className="sidebar-user">{user?.name} · {user?.role}</span><button className="menu-item" onClick={logout}><span className="nav-icon">↗</span><span className="nav-label">Sign out</span></button></div></aside>
    <button className={`crm-sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`} type="button" onClick={closeDrawer} aria-label="Close navigation" />
    <main className="dash-main-content"><header className="dash-topbar"><div className="crm-topbar-left"><button className="crm-sidebar-toggle" type="button" onClick={() => window.innerWidth <= 768 ? setSidebarOpen(true) : setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed}>☰</button><div><h1 className="topbar-title">{view === 'overview' ? 'Dashboard Overview' : view === 'customers' ? 'Customer Directory' : selected?.name}</h1><p className="crm-subtitle">{view === 'customer' ? 'Customer profile, interactions and follow-ups' : 'Your shared CRM workspace'}</p></div></div><button className="btn-primary" onClick={() => { setCustomerForm(blankCustomer); setModal('customer'); }}>+ Add customer</button></header>
      {error && <div className="inline-alert inline-alert-danger">{error}<button type="button" onClick={() => setError('')}>×</button></div>}
      {notice && <div className="inline-alert inline-alert-info">{notice}</div>}
      {loading ? <div className="empty-state-box">Loading CRM data…</div> : <>
        {view === 'overview' && <section><div className="kpi-cards-grid"><article className="kpi-card"><span className="kpi-label">Total customers</span><strong className="kpi-number">{dashboard?.summary?.totalCustomers ?? 0}</strong></article><article className="kpi-card"><span className="kpi-label">Open follow-ups</span><strong className="kpi-number">{dashboard?.summary?.pendingFollowUps ?? 0}</strong></article></div><div className="crm-grid"><article className="card-box"><h2>Recent interactions</h2>{dashboard?.recentInteractions?.length ? dashboard.recentInteractions.map(i => <button className="crm-row" key={i.id} onClick={() => openCustomer(i.customer)}><strong>{i.customer.name}</strong><span>{i.type.replaceAll('_', ' ')} · {dateText(i.date)}</span><small>{i.description}</small></button>) : <p className="empty-state-mini">No interactions recorded yet.</p>}</article><article className="card-box"><h2>Upcoming follow-ups</h2>{dashboard?.upcomingFollowUps?.length ? dashboard.upcomingFollowUps.map(f => <button className="crm-row" key={f.id} onClick={() => openCustomer(f.customer)}><strong>{f.customer.name}</strong><span>{f.title}</span><small>{f.status} · {dateText(f.dueAt)}</small></button>) : <p className="empty-state-mini">No upcoming follow-ups.</p>}</article></div></section>}
        {view === 'customers' && <section className="card-box"><div className="crm-toolbar"><input aria-label="Search customers" placeholder="Search name, email, phone or company" value={search} onChange={e => setSearch(e.target.value)} /><span>{customers.length} customer{customers.length === 1 ? '' : 's'}</span></div>{customers.length ? <div className="crm-table">{customers.map(c => <article key={c.id} className="crm-customer"><button onClick={() => openCustomer(c)}><strong>{c.name}</strong><span>{c.company || 'No company'} · {c.email || c.phone || 'No contact details'}</span></button><span className={`status-badge ${c.status === 'ACTIVE' ? 'status-green' : 'status-orange'}`}>{c.status}</span></article>)}</div> : <div className="empty-state-box"><h2>No customers found</h2><p>Add your first customer or try a different search.</p></div>}</section>}
        {view === 'customer' && <section>{detailLoading ? <div className="empty-state-box">Loading customer activity…</div> : <><div className="card-box"><div className="crm-detail-head"><div><h2>{selected?.name}</h2><p>{selected?.company || 'No company'} · {selected?.email || 'No email'} · {selected?.phone || 'No phone'}</p><p>{selected?.notes || 'No notes added.'}</p></div><div><button className="btn-secondary" onClick={() => { setCustomerForm(selected); setModal('edit-customer'); }}>Edit</button>{admin && <button className="btn-delete" onClick={() => destroy('customer', selected)}>Delete</button>}</div></div></div><div className="crm-grid"><Activity title="Interactions" empty="No interactions yet." items={interactions} add={() => { setInteractionForm(blankInteraction); setModal('interaction'); }} render={i => <><strong>{i.type.replaceAll('_', ' ')}</strong><span>{dateText(i.date)}</span><small>{i.description}</small></>} edit={i => { setInteractionForm({ ...i, date: i.date ? new Date(i.date).toISOString().slice(0, 16) : '' }); setModal('edit-interaction'); }} remove={i => destroy('interaction', i)} admin={admin}/><Activity title="Follow-ups" empty="No follow-ups yet." items={followUps} add={() => { setFollowUpForm(blankFollowUp); setModal('followup'); }} render={f => <><strong>{f.title}</strong><span>{f.status} · {dateText(f.dueAt)}</span><small>{f.description || 'No description'}</small></>} edit={f => { setFollowUpForm({ ...f, dueAt: new Date(f.dueAt).toISOString().slice(0, 16) }); setModal('edit-followup'); }} remove={f => destroy('follow-up', f)} complete={complete} admin={admin}/></div></>}</section>}
      </>}
    </main>
    {modal === 'customer' || modal === 'edit-customer' ? <Modal title={modal === 'customer' ? 'Add customer' : 'Edit customer'} onClose={() => setModal(null)}><form className="modal-form" onSubmit={saveCustomer}><FormField label="Name *"><input required value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}/></FormField><FormField label="Email"><input type="email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}/></FormField><FormField label="Phone"><input value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}/></FormField><FormField label="Company"><input value={customerForm.company} onChange={e => setCustomerForm({ ...customerForm, company: e.target.value })}/></FormField><FormField label="Status"><select value={customerForm.status} onChange={e => setCustomerForm({ ...customerForm, status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select></FormField><FormField label="Notes"><textarea value={customerForm.notes} onChange={e => setCustomerForm({ ...customerForm, notes: e.target.value })}/></FormField><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save customer'}</button></form></Modal> : null}
    {modal === 'interaction' || modal === 'edit-interaction' ? <Modal title="Interaction" onClose={() => setModal(null)}><form className="modal-form" onSubmit={saveInteraction}><FormField label="Type *"><select value={interactionForm.type} onChange={e => setInteractionForm({ ...interactionForm, type: e.target.value })}>{['PHONE_CALL','EMAIL','MEETING','MESSAGE','GENERAL_NOTE'].map(x => <option key={x}>{x}</option>)}</select></FormField><FormField label="Description *"><textarea required value={interactionForm.description} onChange={e => setInteractionForm({ ...interactionForm, description: e.target.value })}/></FormField><FormField label="Date"><input type="datetime-local" value={interactionForm.date} onChange={e => setInteractionForm({ ...interactionForm, date: e.target.value })}/></FormField><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save interaction'}</button></form></Modal> : null}
    {modal === 'followup' || modal === 'edit-followup' ? <Modal title="Follow-up" onClose={() => setModal(null)}><form className="modal-form" onSubmit={saveFollowUp}><FormField label="Title *"><input required value={followUpForm.title} onChange={e => setFollowUpForm({ ...followUpForm, title: e.target.value })}/></FormField><FormField label="Description"><textarea value={followUpForm.description} onChange={e => setFollowUpForm({ ...followUpForm, description: e.target.value })}/></FormField><FormField label="Due at *"><input type="datetime-local" required value={followUpForm.dueAt} onChange={e => setFollowUpForm({ ...followUpForm, dueAt: e.target.value })}/></FormField><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save follow-up'}</button></form></Modal> : null}
  </div>;
}

function Activity({ title, empty, items, add, render, edit, remove, complete, admin }) { return <article className="card-box"><div className="crm-section-head"><h2>{title}</h2><button className="btn-secondary" onClick={add}>+ Add</button></div>{items.length ? items.map(item => <article className="crm-activity" key={item.id}><div>{render(item)}</div><div className="crm-actions"><button onClick={() => edit(item)}>Edit</button>{complete && item.status !== 'COMPLETED' && <button onClick={() => complete(item)}>Complete</button>}{admin && <button className="danger-link" onClick={() => remove(item)}>Delete</button>}</div></article>) : <p className="empty-state-mini">{empty}</p>}</article>; }
