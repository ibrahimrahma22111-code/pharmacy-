import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import './Medicines.css';

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    quantity: '',
    unit_price: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMedicine) {
        await api.put(`/medicines/${editingMedicine.id}`, formData);
      } else {
        await api.post('/medicines', formData);
      }
      fetchMedicines();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving medicine');
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name || '',
      generic_name: medicine.generic_name || '',
      manufacturer: medicine.manufacturer || '',
      batch_number: medicine.batch_number || '',
      expiry_date: medicine.expiry_date || '',
      quantity: medicine.quantity || '',
      unit_price: medicine.unit_price || '',
      category: medicine.category || '',
      description: medicine.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) {
      return;
    }
    try {
      await api.delete(`/medicines/${id}`);
      fetchMedicines();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting medicine');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMedicine(null);
    setFormData({
      name: '',
      generic_name: '',
      manufacturer: '',
      batch_number: '',
      expiry_date: '',
      quantity: '',
      unit_price: '',
      category: '',
      description: ''
    });
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medicine.generic_name && medicine.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="medicines-loading">Loading medicines...</div>;
  }

  return (
    <div className="medicines">
      <div className="medicines-header">
        <div>
          <h1>Medicines</h1>
          <p>Manage your medicine inventory</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add Medicine
        </button>
      </div>

      <div className="medicines-toolbar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="medicines-table-container">
        <table className="medicines-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Generic Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">No medicines found</td>
              </tr>
            ) : (
              filteredMedicines.map((medicine) => (
                <tr key={medicine.id} className={medicine.quantity < 10 ? 'low-stock' : ''}>
                  <td>{medicine.name}</td>
                  <td>{medicine.generic_name || '-'}</td>
                  <td>{medicine.category || '-'}</td>
                  <td>
                    <span className={medicine.quantity < 10 ? 'quantity-low' : ''}>
                      {medicine.quantity}
                    </span>
                  </td>
                  <td>${medicine.unit_price}</td>
                  <td>{medicine.expiry_date || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(medicine)} className="btn-edit">
                        <FiEdit />
                      </button>
                      <button onClick={() => handleDelete(medicine.id)} className="btn-delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="medicine-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Medicine Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Generic Name</label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingMedicine ? 'Update' : 'Add'} Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Medicines;

