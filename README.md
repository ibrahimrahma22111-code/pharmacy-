# Pharmacy Management System

A comprehensive pharmacy management system built with React and Node.js/Express. This system helps manage medicines, sales, customers, and prescriptions efficiently.

## Features

- **Dashboard**: Overview of key metrics and recent sales
- **Medicine Management**: Add, edit, delete, and search medicines with inventory tracking
- **Sales Management**: Process sales, manage transactions, and view sale history
- **Customer Management**: Maintain customer database with contact information
- **Prescription Management**: Record and manage prescriptions from doctors
- **Low Stock Alerts**: Automatic alerts for medicines running low
- **User Authentication**: Secure login system with JWT tokens

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- React Icons
- Recharts for charts

### Backend
- Node.js
- Express.js
- SQLite database
- JWT authentication
- bcryptjs for password hashing

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Add new medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create new sale

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `POST /api/prescriptions` - Add new prescription

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Database Schema

The system uses SQLite with the following main tables:
- `users` - User accounts
- `medicines` - Medicine inventory
- `customers` - Customer information
- `suppliers` - Supplier information
- `sales` - Sales transactions
- `sale_items` - Individual items in sales
- `prescriptions` - Prescription records
- `prescription_items` - Medicines in prescriptions

## Project Structure

```
pharmacy-system/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   └── pharmacy.db        # SQLite database (created automatically)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context (Auth)
│   │   ├── services/      # API service
│   │   ├── App.js
│   │   └── index.js
│   └── package.json       # Frontend dependencies
└── README.md
```

## Features in Detail

### Medicine Management
- Track medicine inventory with quantity and expiry dates
- Search and filter medicines
- Low stock warnings (quantity < 10)
- Category organization

### Sales Processing
- Add multiple medicines to cart
- Real-time stock updates
- Customer selection (optional)
- Multiple payment methods
- Sale history and details

### Customer Management
- Store customer contact information
- Quick search functionality
- Link customers to sales and prescriptions

### Prescription Management
- Record doctor prescriptions
- Add multiple medicines per prescription
- Track dosage and instructions
- Link to customers

## Development

To run both frontend and backend simultaneously, you can use two terminal windows or a process manager like `concurrently`.

## Security Notes

- Change the default admin password after first login
- Update JWT_SECRET in production
- Consider using environment variables for sensitive data
- Implement proper CORS policies for production

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

