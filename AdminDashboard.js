import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTag, faChair, faBuilding, faUserSecret, faFire, 
  faTrash, faImage, faListCheck, faFileExcel 
} from '@fortawesome/free-solid-svg-icons';
import './App.css'; 

const API_BASE_URL = 'http://localhost:5000/api/admin';

function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [viewMode, setViewMode] = useState('inventory');
  const [stats, setStats] = useState({ hostels: [], leads: [], total_leads: 0, most_popular: "N/A" });
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    if (isAuthenticated) loadDashboardData(); 
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/dashboard-stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Connection to backend failed.", err);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect Password!");
      setPasswordInput('');
    }
  };

  const handleAddNew = async () => {
    const name = prompt("Enter New Hostel Name:");
    if (!name) return;
    try {
      await axios.post(`${API_BASE_URL}/hostels/add`, { name: name, type: 'Girls', price: 15000, seats: 10 });
      loadDashboardData();
    } catch (err) {
      alert("Error adding hostel.");
    }
  };

  const deleteHostel = async (id) => {
    if(window.confirm("Permanent Delete? This cannot be undone.")) {
      try {
        await axios.delete(`${API_BASE_URL}/hostels/delete/${id}`);
        loadDashboardData();
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      id: selectedHostel.id,
      name: formData.get('name'),
      type: formData.get('type'),
      price: parseInt(formData.get('price')),
      seats: parseInt(formData.get('seats')),
      image_url: formData.get('image'),
      specifications: formData.get('specs'),
      is_studio: formData.get('is_studio') === 'on',
      has_kitchen: formData.get('has_kitchen') === 'on',
      has_garden: formData.get('has_garden') === 'on',
      has_balcony: formData.get('has_balcony') === 'on'
    };
    try {
      await axios.post(`${API_BASE_URL}/hostels/full-update`, updatedData);
      alert("Changes saved successfully!");
      setSelectedHostel(null);
      loadDashboardData();
    } catch (err) {
      alert("Error saving changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/export-excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'HostelSafe_Leads.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error downloading file.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a'}}>
        <form onSubmit={handleAdminLogin} style={{background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', width: '350px'}}>
          <h2 style={{marginBottom: '20px', color: '#0f172a'}}>Admin Access Restricted</h2>
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{padding: '12px', width: '100%', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box'}}
            required 
          />
          <button type="submit" style={{width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'}}>
            Login to Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <div className="admin-logo">Hostel<span>Safe</span> Pro</div>
        <nav>
          <button className={viewMode === 'inventory' ? 'active' : ''} onClick={() => setViewMode('inventory')}>
             <FontAwesomeIcon icon={faBuilding} style={{marginRight: '10px'}} /> Inventory
          </button>
          <button className={viewMode === 'enquiries' ? 'active' : ''} onClick={() => setViewMode('enquiries')}>
             <FontAwesomeIcon icon={faUserSecret} style={{marginRight: '10px'}} /> Enquiries
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="stats-grid">
          <div className="stat-card modern">
            <FontAwesomeIcon icon={faBuilding} className="big-icon blue-bg" />
            <div className="stat-info">
              <h3>{stats.hostels?.length || 0}</h3>
              <p>Total Hostels</p>
            </div>
          </div>
          <div className="stat-card modern">
            <FontAwesomeIcon icon={faUserSecret} className="big-icon blue-bg" />
            <div className="stat-info">
              <h3>{stats.total_leads || 0}</h3>
              <p>Total User Leads</p>
            </div>
          </div>
          <div className="stat-card modern highlight-card">
            <FontAwesomeIcon icon={faFire} className="big-icon orange-bg" />
            <div className="stat-info">
              <h3>{stats.most_popular}</h3>
              <p>Most Popular (Clicks)</p>
            </div>
          </div>
        </header>

        {viewMode === 'inventory' ? (
          <div className="table-container fade-in">
            <div className="table-header">
              <h2>Inventory Management</h2>
              <button className="btn-add-new" onClick={handleAddNew}>+ Add New Hostel</button>
            </div>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Hostel Details</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.hostels.map(h => (
                  <tr key={h.id}>
                    <td className="hostel-info-cell" onClick={() => setSelectedHostel(h)}>
                      <strong>{h.name}</strong>
                      <span>{h.type} • ID: {h.id}</span>
                    </td>
                    <td>₹{h.price}</td>
                    <td>
                      <div className="progress-bar">
                        <div className="fill" style={{width: `${Math.min((h.seats/20)*100, 100)}%`}}></div>
                      </div>
                      <small>{h.seats} seats available</small>
                    </td>
                    <td>
                      <button className="btn-icon delete" onClick={() => deleteHostel(h.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container fade-in">
            <div className="table-header">
              <h2>User Enquiries & Bookings</h2>
              <button className="btn-save-pro" onClick={handleDownloadExcel} style={{backgroundColor: '#10b981'}}>
                <FontAwesomeIcon icon={faFileExcel} style={{marginRight: '8px'}} /> Download Excel
              </button>
            </div>
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Lead Email</th>
                  <th>Interested Property</th>
                  <th>Scheduled Visit Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.leads && stats.leads.length > 0 ? (
                  stats.leads.map(lead => (
                    <tr key={lead.id}>
                      <td>
                        <strong>{lead.email}</strong><br/>
                        <small style={{color: '#64748b'}}>Lead ID: {lead.id}</small>
                      </td>
                      <td>
                        <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500'}}>
                          {lead.hostel}
                        </span>
                      </td>
                      <td style={{fontWeight: lead.visit_date !== 'No Date Set' ? 'bold' : 'normal', color: lead.visit_date !== 'No Date Set' ? '#2563eb' : '#64748b'}}>
                        {lead.visit_date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>
                      No enquiries yet. Leads from the chatbot will appear here!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selectedHostel && (
        <div className="modal-overlay full-screen">
          <form className="modal-window large" onSubmit={handleUpdate}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faBuilding} /> Manage: {selectedHostel.name}</h2>
              <button type="button" className="close-x" onClick={() => setSelectedHostel(null)}>&times;</button>
            </div>
            <div className="modal-body scrollable">
              <div className="modal-grid-3">
                <div className="form-section">
                  <h3><FontAwesomeIcon icon={faTag} /> Basic Info</h3>
                  <label>Hostel Name</label>
                  <input name="name" type="text" defaultValue={selectedHostel.name} required />
                  <label>Category</label>
                  <select name="type" defaultValue={selectedHostel.type}>
                    <option value="Girls">Girls</option>
                    <option value="Boys">Boys</option>
                    <option value="Co-living">Co-living</option>
                  </select>
                </div>
                <div className="form-section">
                  <h3><FontAwesomeIcon icon={faChair} /> Inventory</h3>
                  <label>Monthly Rent (₹)</label>
                  <input name="price" type="number" defaultValue={selectedHostel.price} required />
                  <label>Seats Available</label>
                  <input name="seats" type="number" defaultValue={selectedHostel.seats} required />
                </div>
                <div className="form-section">
                  <h3><FontAwesomeIcon icon={faListCheck} /> Facilities</h3>
                  <div className="checkbox-group">
                    <label><input name="is_studio" type="checkbox" defaultChecked={selectedHostel.is_studio} /> Studio</label>
                    <label><input name="has_kitchen" type="checkbox" defaultChecked={selectedHostel.has_kitchen} /> Kitchen</label>
                    <label><input name="has_garden" type="checkbox" defaultChecked={selectedHostel.has_garden} /> Garden Area</label>
                    <label><input name="has_balcony" type="checkbox" defaultChecked={selectedHostel.has_balcony} /> Balcony</label>
                  </div>
                </div>
              </div>
              <div className="form-full-width" style={{marginTop: '20px'}}>
                <h3><FontAwesomeIcon icon={faImage} /> Media & Specs</h3>
                <label>Image URL</label>
                <input name="image" type="text" style={{width: '100%'}} defaultValue={selectedHostel.image_url} />
                <label style={{marginTop: '15px'}}>Specifications</label>
                <textarea name="specs" style={{width: '100%', height: '100px'}} defaultValue={selectedHostel.specifications}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setSelectedHostel(null)}>Cancel</button>
              <button type="submit" className="btn-save-pro" disabled={loading}>{loading ? "Saving..." : "Save All Changes"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;