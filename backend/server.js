const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_secret_key_2024';

app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'pharmacist',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Medicines table
  db.run(`CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    generic_name TEXT,
    manufacturer TEXT,
    batch_number TEXT,
    expiry_date DATE,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL,
    category TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Suppliers table
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`);

  // Sale items table
  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
  )`);

  // Prescriptions table
  db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    doctor_name TEXT,
    prescription_date DATE,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`);

  // Prescription items table
  db.run(`CREATE TABLE IF NOT EXISTS prescription_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    dosage TEXT,
    instructions TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
  )`);

  // Create default admin user
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
    ['admin', defaultPassword, 'admin']);
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Pharmacy Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      root: '/',
      apiInfo: '/api',
      login: 'POST /api/auth/login',
      medicines: 'GET /api/medicines',
      customers: 'GET /api/customers',
      sales: 'GET /api/sales',
      prescriptions: 'GET /api/prescriptions',
      dashboard: 'GET /api/dashboard/stats'
    },
    note: 'All API endpoints except /api/auth/login require authentication token'
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    message: 'Pharmacy Management System API',
    version: '1.0.0',
    baseUrl: '/api',
    endpoints: {
      auth: {
        login: {
          method: 'POST',
          path: '/api/auth/login',
          auth: false,
          description: 'User login (returns JWT token)'
        }
      },
      medicines: {
        list: {
          method: 'GET',
          path: '/api/medicines',
          auth: true,
          queryParams: ['search', 'category', 'lowStock']
        },
        get: {
          method: 'GET',
          path: '/api/medicines/:id',
          auth: true
        },
        create: {
          method: 'POST',
          path: '/api/medicines',
          auth: true
        },
        update: {
          method: 'PUT',
          path: '/api/medicines/:id',
          auth: true
        },
        delete: {
          method: 'DELETE',
          path: '/api/medicines/:id',
          auth: true
        }
      },
      customers: {
        list: {
          method: 'GET',
          path: '/api/customers',
          auth: true,
          queryParams: ['search']
        },
        create: {
          method: 'POST',
          path: '/api/customers',
          auth: true
        },
        update: {
          method: 'PUT',
          path: '/api/customers/:id',
          auth: true
        },
        delete: {
          method: 'DELETE',
          path: '/api/customers/:id',
          auth: true
        }
      },
      sales: {
        list: {
          method: 'GET',
          path: '/api/sales',
          auth: true,
          queryParams: ['startDate', 'endDate']
        },
        get: {
          method: 'GET',
          path: '/api/sales/:id',
          auth: true
        },
        create: {
          method: 'POST',
          path: '/api/sales',
          auth: true
        }
      },
      prescriptions: {
        list: {
          method: 'GET',
          path: '/api/prescriptions',
          auth: true
        },
        create: {
          method: 'POST',
          path: '/api/prescriptions',
          auth: true
        }
      },
      dashboard: {
        stats: {
          method: 'GET',
          path: '/api/dashboard/stats',
          auth: true,
          description: 'Get dashboard statistics'
        }
      }
    },
    authentication: 'Use Bearer token in Authorization header: Authorization: Bearer <token>'
  });
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
});

// Medicines routes
app.get('/api/medicines', authenticateToken, (req, res) => {
  const { search, category, lowStock } = req.query;
  let query = 'SELECT * FROM medicines WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR generic_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (lowStock === 'true') {
    query += ' AND quantity < 10';
  }

  query += ' ORDER BY name';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/medicines/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM medicines WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json(row);
  });
});

app.post('/api/medicines', authenticateToken, (req, res) => {
  const { name, generic_name, manufacturer, batch_number, expiry_date, quantity, unit_price, category, description } = req.body;

  db.run(
    `INSERT INTO medicines (name, generic_name, manufacturer, batch_number, expiry_date, quantity, unit_price, category, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, generic_name, manufacturer, batch_number, expiry_date, quantity, unit_price, category, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Medicine added successfully' });
    }
  );
});

app.put('/api/medicines/:id', authenticateToken, (req, res) => {
  const { name, generic_name, manufacturer, batch_number, expiry_date, quantity, unit_price, category, description } = req.body;

  db.run(
    `UPDATE medicines SET name = ?, generic_name = ?, manufacturer = ?, batch_number = ?, expiry_date = ?, 
     quantity = ?, unit_price = ?, category = ?, description = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, generic_name, manufacturer, batch_number, expiry_date, quantity, unit_price, category, description, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Medicine updated successfully' });
    }
  );
});

app.delete('/api/medicines/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM medicines WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Medicine deleted successfully' });
  });
});

// Customers routes
app.get('/api/customers', authenticateToken, (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/customers', authenticateToken, (req, res) => {
  const { name, phone, email, address } = req.body;

  db.run(
    'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
    [name, phone, email, address],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Customer added successfully' });
    }
  );
});

app.put('/api/customers/:id', authenticateToken, (req, res) => {
  const { name, phone, email, address } = req.body;

  db.run(
    'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
    [name, phone, email, address, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Customer updated successfully' });
    }
  );
});

app.delete('/api/customers/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

// Sales routes
app.get('/api/sales', authenticateToken, (req, res) => {
  const { startDate, endDate } = req.query;
  let query = `
    SELECT s.*, c.name as customer_name 
    FROM sales s 
    LEFT JOIN customers c ON s.customer_id = c.id 
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    query += ' AND DATE(s.created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND DATE(s.created_at) <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY s.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/sales/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT s.*, c.name as customer_name, c.phone as customer_phone,
           si.id as item_id, si.quantity, si.unit_price, si.total_price,
           m.name as medicine_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN medicines m ON si.medicine_id = m.id
    WHERE s.id = ?
  `;

  db.all(query, [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = {
      id: rows[0].id,
      customer_id: rows[0].customer_id,
      customer_name: rows[0].customer_name,
      customer_phone: rows[0].customer_phone,
      total_amount: rows[0].total_amount,
      payment_method: rows[0].payment_method,
      created_at: rows[0].created_at,
      items: rows.map(row => ({
        id: row.item_id,
        medicine_name: row.medicine_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        total_price: row.total_price
      }))
    };

    res.json(sale);
  });
});

app.post('/api/sales', authenticateToken, (req, res) => {
  const { customer_id, items, payment_method } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Sale must have at least one item' });
  }

  const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'INSERT INTO sales (customer_id, total_amount, payment_method) VALUES (?, ?, ?)',
      [customer_id || null, total_amount, payment_method || 'cash'],
      function(err) {
        if (err) {
          db.run('ROLLBACK', () => {
            res.status(500).json({ error: err.message });
          });
          return;
        }

        const saleId = this.lastID;
        let completed = 0;
        let hasError = false;

        const insertItem = (index) => {
          if (hasError) return;
          
          if (index >= items.length) {
            db.run('COMMIT', (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ id: saleId, message: 'Sale completed successfully' });
            });
            return;
          }

          const item = items[index];
          
          // Check if medicine has enough stock
          db.get('SELECT quantity FROM medicines WHERE id = ?', [item.medicine_id], (err, medicine) => {
            if (err || !medicine) {
              hasError = true;
              db.run('ROLLBACK', () => {
                res.status(500).json({ error: err ? err.message : 'Medicine not found' });
              });
              return;
            }

            if (medicine.quantity < item.quantity) {
              hasError = true;
              db.run('ROLLBACK', () => {
                res.status(400).json({ error: `Insufficient stock for medicine ID ${item.medicine_id}` });
              });
              return;
            }

            db.run(
              'INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
              [saleId, item.medicine_id, item.quantity, item.unit_price, item.quantity * item.unit_price],
              function(err) {
                if (err) {
                  hasError = true;
                  db.run('ROLLBACK', () => {
                    res.status(500).json({ error: err.message });
                  });
                  return;
                }

                // Update medicine quantity
                db.run(
                  'UPDATE medicines SET quantity = quantity - ? WHERE id = ?',
                  [item.quantity, item.medicine_id],
                  (err) => {
                    if (err) {
                      hasError = true;
                      db.run('ROLLBACK', () => {
                        res.status(500).json({ error: err.message });
                      });
                      return;
                    }
                    insertItem(index + 1);
                  }
                );
              }
            );
          });
        };

        insertItem(0);
      }
    );
  });
});

// Prescriptions routes
app.get('/api/prescriptions', authenticateToken, (req, res) => {
  const query = `
    SELECT p.*, c.name as customer_name 
    FROM prescriptions p 
    LEFT JOIN customers c ON p.customer_id = c.id 
    ORDER BY p.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/prescriptions', authenticateToken, (req, res) => {
  const { customer_id, doctor_name, prescription_date, notes, items } = req.body;

  db.run(
    'INSERT INTO prescriptions (customer_id, doctor_name, prescription_date, notes) VALUES (?, ?, ?, ?)',
    [customer_id || null, doctor_name, prescription_date, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const prescriptionId = this.lastID;

      if (items && items.length > 0) {
        items.forEach(item => {
          db.run(
            'INSERT INTO prescription_items (prescription_id, medicine_id, quantity, dosage, instructions) VALUES (?, ?, ?, ?, ?)',
            [prescriptionId, item.medicine_id, item.quantity, item.dosage, item.instructions]
          );
        });
      }

      res.json({ id: prescriptionId, message: 'Prescription added successfully' });
    }
  );
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as count FROM medicines', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalMedicines = row.count;

    db.get('SELECT COUNT(*) as count FROM medicines WHERE quantity < 10', [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.lowStockMedicines = row.count;

      db.get('SELECT COUNT(*) as count FROM customers', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalCustomers = row.count;

        db.get('SELECT SUM(total_amount) as total FROM sales WHERE DATE(created_at) = DATE("now")', [], (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.todaySales = row.total || 0;

          db.get('SELECT COUNT(*) as count FROM sales WHERE DATE(created_at) = DATE("now")', [], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.todayTransactions = row.count;

            res.json(stats);
          });
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Pharmacy server running on port ${PORT}`);
});

