import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlus, FiSearch, FiX } from 'react-icons/fi';
import './Prescriptions.css';

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    doctor_name: '',
    prescription_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchMedicines();
    fetchCustomers();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/prescriptions');
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine_id: '', quantity: 1, dosage: '', instructions: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prescriptions', formData);
      alert('Prescription added successfully!');
      setFormData({
        customer_id: '',
        doctor_name: '',
        prescription_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
      });
      setShowModal(false);
      fetchPrescriptions();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving prescription');
    }
  };

  if (loading) {
    return <div className="prescriptions-loading">Loading prescriptions...</div>;
  }

  return (
    <div className="prescriptions">
      <div className="prescriptions-header">
        <div>
          <h1>Prescriptions</h1>
          <p>Manage prescriptions</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add Prescription
        </button>
      </div>

      <div className="prescriptions-list">
        {prescriptions.length === 0 ? (
          <div className="empty-state">No prescriptions found</div>
        ) : (
          prescriptions.map((prescription) => (
            <div key={prescription.id} className="prescription-card">
              <div className="prescription-header">
                <div>
                  <h3>Prescription #{prescription.id}</h3>
                  <p className="prescription-meta">
                    {prescription.customer_name || 'Walk-in Customer'} • 
                    Dr. {prescription.doctor_name || 'N/A'} • 
                    {new Date(prescription.prescription_date || prescription.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`status-badge ${prescription.status}`}>
                  {prescription.status}
                </span>
              </div>
              {prescription.notes && (
                <div className="prescription-notes">
                  <strong>Notes:</strong> {prescription.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Prescription</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="prescription-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Doctor Name</label>
                  <input
                    type="text"
                    value={formData.doctor_name}
                    onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prescription Date</label>
                  <input
                    type="date"
                    value={formData.prescription_date}
                    onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              
              <div className="prescription-items">
                <div className="items-header">
                  <h3>Medicines</h3>
                  <button type="button" onClick={handleAddItem} className="btn-add-item">
                    <FiPlus /> Add Medicine
                  </button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="prescription-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Medicine</label>
                        <select
                          value={item.medicine_id}
                          onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)}
                          required
                        >
                          <option value="">Select Medicine</option>
                          {medicines.map(medicine => (
                            <option key={medicine.id} value={medicine.id}>
                              {medicine.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Dosage</label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div className="form-group">
                        <label>Instructions</label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                          placeholder="e.g., Take twice daily"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="btn-remove-item"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Prescriptions;

