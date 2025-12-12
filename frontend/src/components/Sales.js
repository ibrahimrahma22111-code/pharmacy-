import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlus, FiSearch, FiEye } from 'react-icons/fi';
import './Sales.css';

function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchSales();
    fetchMedicines();
    fetchCustomers();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
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

  const handleAddToCart = (medicine) => {
    const existingItem = cart.find(item => item.medicine_id === medicine.id);
    
    if (existingItem) {
      if (existingItem.quantity >= medicine.quantity) {
        alert('Not enough stock available');
        return;
      }
      setCart(cart.map(item =>
        item.medicine_id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (medicine.quantity < 1) {
        alert('Medicine out of stock');
        return;
      }
      setCart([...cart, {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        quantity: 1,
        unit_price: medicine.unit_price
      }]);
    }
  };

  const handleRemoveFromCart = (medicineId) => {
    setCart(cart.filter(item => item.medicine_id !== medicineId));
  };

  const handleUpdateQuantity = (medicineId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(medicineId);
      return;
    }
    
    const medicine = medicines.find(m => m.id === medicineId);
    if (newQuantity > medicine.quantity) {
      alert('Not enough stock available');
      return;
    }

    setCart(cart.map(item =>
      item.medicine_id === medicineId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      await api.post('/sales', {
        customer_id: selectedCustomer || null,
        items: cart,
        payment_method: paymentMethod
      });
      
      alert('Sale completed successfully!');
      setCart([]);
      setSelectedCustomer('');
      setPaymentMethod('cash');
      setShowModal(false);
      fetchSales();
      fetchMedicines();
    } catch (error) {
      alert(error.response?.data?.error || 'Error processing sale');
    }
  };

  const handleViewDetails = async (saleId) => {
    try {
      const response = await api.get(`/sales/${saleId}`);
      setSelectedSale(response.data);
      setShowDetailModal(true);
    } catch (error) {
      alert('Error fetching sale details');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  if (loading) {
    return <div className="sales-loading">Loading sales...</div>;
  }

  return (
    <div className="sales">
      <div className="sales-header">
        <div>
          <h1>Sales</h1>
          <p>Manage sales and transactions</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> New Sale
        </button>
      </div>

      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">No sales found</td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>{sale.customer_name || 'Walk-in'}</td>
                  <td>${sale.total_amount.toFixed(2)}</td>
                  <td>{sale.payment_method}</td>
                  <td>{new Date(sale.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => handleViewDetails(sale.id)}
                      className="btn-view"
                    >
                      <FiEye /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Sale</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="sale-modal-body">
              <div className="sale-left">
                <div className="form-group">
                  <label>Select Customer (Optional)</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="medicines-list">
                  <h3>Available Medicines</h3>
                  <div className="medicines-grid">
                    {medicines.filter(m => m.quantity > 0).map(medicine => (
                      <div key={medicine.id} className="medicine-card">
                        <div className="medicine-info">
                          <div className="medicine-name">{medicine.name}</div>
                          <div className="medicine-details">
                            <span>Stock: {medicine.quantity}</span>
                            <span>${medicine.unit_price}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCart(medicine)}
                          className="btn-add"
                          disabled={medicine.quantity === 0}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sale-right">
                <div className="cart-section">
                  <h3>Cart ({cart.length})</h3>
                  {cart.length === 0 ? (
                    <p className="empty-cart">Cart is empty</p>
                  ) : (
                    <div className="cart-items">
                      {cart.map(item => (
                        <div key={item.medicine_id} className="cart-item">
                          <div className="cart-item-info">
                            <div className="cart-item-name">{item.medicine_name}</div>
                            <div className="cart-item-price">${item.unit_price} each</div>
                          </div>
                          <div className="cart-item-controls">
                            <button
                              onClick={() => handleUpdateQuantity(item.medicine_id, item.quantity - 1)}
                              className="qty-btn"
                            >
                              -
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.medicine_id, item.quantity + 1)}
                              className="qty-btn"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleRemoveFromCart(item.medicine_id)}
                              className="btn-remove"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="cart-item-total">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="checkout-section">
                  <div className="total-amount">
                    <span>Total:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="btn-checkout"
                    disabled={cart.length === 0}
                  >
                    Complete Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sale Details #{selectedSale.id}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                ×
              </button>
            </div>
            <div className="sale-details">
              <div className="detail-row">
                <span>Customer:</span>
                <span>{selectedSale.customer_name || 'Walk-in'}</span>
              </div>
              <div className="detail-row">
                <span>Payment Method:</span>
                <span>{selectedSale.payment_method}</span>
              </div>
              <div className="detail-row">
                <span>Date:</span>
                <span>{new Date(selectedSale.created_at).toLocaleString()}</span>
              </div>
              <h3>Items</h3>
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedSale.items || []).map((item, index) => (
                    <tr key={index}>
                      <td>{item.medicine_name || 'N/A'}</td>
                      <td>{item.quantity || 0}</td>
                      <td>${(item.unit_price || 0).toFixed(2)}</td>
                      <td>${(item.total_price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3"><strong>Total Amount</strong></td>
                    <td><strong>${(selectedSale.total_amount || 0).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;

