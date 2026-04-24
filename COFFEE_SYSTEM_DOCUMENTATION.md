# ☕ Coffee Shop Inventory System - Documentation

## 🎯 System Overview

The **Coffee Shop Inventory System** is a modern web-based inventory management solution designed specifically for coffee shops. It provides an intuitive interface to track products, monitor stock levels, and generate reports with a clean, professional design.

**Database:** `inventory_coffee` (PostgreSQL)  
**Backend:** Node.js + Express (Port 4000)  
**Frontend:** React + Vite + Tailwind CSS  
**Theme:** Coffee-inspired (warm browns, ambers, and creams)

---

## 📋 System Architecture

### **Database Schema** (`coffee_inventory`)

#### **Admin Users Table**

```
admin_users:
  - admin_id (Primary Key)
  - full_name
  - email (Unique)
  - password_hash (bcrypt encrypted)
  - role (Admin)
  - workspace_name
  - is_active
  - member_since
  - created_at, updated_at
```

#### **Products Table**

```
products:
  - product_id (Primary Key)
  - product_name
  - category (Beans, Milk, Syrup, Supplies, etc.)
  - unit (kg, liters, pcs)
  - quantity (Numeric value)
  - description
  - image_url
  - last_update
  - created_at, updated_at
```

---

## 🏗️ Module Documentation

### **1. Sidebar Navigation**

**Location:** Left fixed sidebar  
**Purpose:** Easy navigation across all system modules

**Features:**

- ✅ Coffee shop branding with icon (☕) and "Coffee Inventory System" text
- ✅ Navigation menu with active page highlighting:
  - **Dashboard** - Quick overview with summary cards
  - **Inventory** - Product management (CRUD operations)
  - **Reports** - Stock analysis and insights
  - **Profile** - Admin account settings
- ✅ "Add Product" button - Creates new inventory items
- ✅ "Update Stock" button - Modifies product quantities
- ✅ Clean, professional layout with warm coffee colors

**Navigation Structure:**

```
Coffee Inventory System (Logo)
├── Dashboard (Dashboard icon)
├── Inventory (Box icon)
├── Reports (Chart icon)
├── Profile (User icon)
├── [Add Product Button]
└── [Update Stock Button]
```

---

### **2. Dashboard Module**

**Purpose:** Provides a quick overview of inventory status and recent activity

**Features:**

- **Summary Cards:**
  - Total number of products in inventory
  - Total stock quantity across all items
  - Number of low stock items (quantity ≤ 20)
  - Number of out-of-stock items (quantity ≤ 0)

- **Search Functionality:**
  - Real-time search across product name, category, unit, and quantity
  - Search placeholder: "Search product, category, unit, quantity..."

- **Product Table Display:**
  - Product name with image thumbnail
  - Category (e.g., Coffee Beans, Milk, Syrup)
  - Unit (e.g., kg, liters, pcs)
  - Quantity
  - Description
  - Latest updates/changes
  - View product details button

- **Pagination:**
  - 10 items per page
  - Previous/Next navigation
  - Page indicator (Page X of Y)

---

### **3. Inventory Module**

**Purpose:** Main product management interface for coffee shop items

**Features:**

- **Product List Display:**
  - Table format with sortable columns
  - Product image thumbnails
  - Category, unit, quantity, description
  - Recent update notes

- **Add Product:**
  - Modal form for creating new products
  - Fields:
    - Product Name (required)
    - Category (required) - e.g., "Coffee Beans", "Milk", "Syrup", "Supplies"
    - Unit (required) - e.g., "kg", "liters", "pcs"
    - Quantity (required, numeric)
    - Description (optional)
    - Image Upload (optional)
  - Image support: JPG, PNG, WEBP

- **Update Product:**
  - Edit existing product details
  - Modify any field (name, category, unit, quantity, description, image)
  - Automatic update timestamp

- **Delete Product:**
  - Remove products from inventory
  - Confirmation dialog before deletion

- **Search & Filter:**
  - Quick product lookup
  - Search across multiple fields

- **Pagination:**
  - 10 products per page
  - Navigation controls

---

### **4. Reports Module**

**Purpose:** Provides analytical insights and inventory status overview

**Features:**

- **Summary Cards:**
  - Total products count
  - Total stock quantity
  - Average quantity per product
  - Number of recently added products

- **Reports:**
  1. **Highest Quantity Products**
     - Top 4 products by stock quantity
     - Shows category and unit
     - Useful for identifying overstocked items

  2. **Low & Out of Stock Items**
     - All items with low stock (≤ 20 units)
     - All items out of stock (≤ 0 units)
     - Quick alert system for restocking

  3. **Recent Product Updates**
     - Latest 5 product modifications
     - Timestamp of changes
     - Helps track inventory activity

---

### **5. Profile Module**

**Purpose:** Manages admin account settings and preferences

**Features:**

- **Profile Information:**
  - View admin name and email
  - Display role and workspace name
  - Member since date

- **Update Profile:**
  - Change full name
  - Update role
  - Update workspace name

- **Email Management:**
  - Change email address
  - Password verification required
  - Email uniqueness validation

- **Password Management:**
  - Change password securely
  - Current password verification
  - New password confirmation
  - Show/hide password toggle

- **Feedback Messages:**
  - Success notifications for updates
  - Error messages with clear descriptions

---

### **6. Authentication (Sign In)**

**Purpose:** Secure system access control

**Features:**

- **Login Form:**
  - Email input
  - Password input
  - Show/hide password toggle
  - Remember me option (optional)

- **Security:**
  - Password hashing with bcrypt
  - Session management
  - Error messages for invalid credentials

- **Default Credentials:**
  - Email: `admin@coffeeshop.com`
  - Password: `password123`

---

## 🎨 Design & Styling

### **Color Scheme (Coffee Theme)**

- **Primary Brown:** #a67c52 (Coffee/Amber)
- **Dark Brown:** #8b6a47 (Deep Coffee)
- **Muted Brown:** #6d5d52 (Muted Tone)
- **Background:** #faf7f2 (Warm Cream)
- **Text:** #2c1f15 (Dark Brown)

### **UI Components**

- Fixed left sidebar (260px width)
- Main content area with full-height layout
- Modal dialogs for product operations
- Summary cards with coffee theme
- Table-based data display
- Search bars with coffee-themed styling
- Buttons with warm color palette

---

## 🚀 Getting Started

### **1. Database Setup**

Database is already initialized with sample data:

```bash
npm run setup:db
```

**Sample Products Included:**

- Arabica Beans (25.50 kg)
- Robusta Beans (15.75 kg)
- Whole Milk (40.00 liters)
- Almond Milk (12.50 liters)
- Vanilla Syrup (8.00 liters)
- Caramel Syrup (6.50 liters)
- Paper Cups (500 pcs)
- Wooden Stirrers (1000 pcs)

### **2. Start Development**

**Backend Server:**

```bash
npm run server
```

Runs on `http://localhost:4000`

**Frontend Development:**

```bash
npm run dev:client
```

Runs on `http://localhost:5173`

**Run Both Together:**

```bash
npm run dev:all
```

### **3. Build for Production**

```bash
npm run build
```

---

## 📁 Project Structure

```
Inventory - Brix/
├── src/
│   ├── App.jsx                 # Main app component
│   ├── index.css              # Global styles (Tailwind + Custom CSS)
│   ├── main.jsx               # React entry point
│   ├── components/
│   │   ├── AppShell.jsx       # Sidebar layout component
│   │   ├── ProductFormModal.jsx
│   │   ├── StatusBadge.jsx
│   │   └── VapeDevice.jsx
│   ├── lib/
│   │   ├── api.js             # API calls
│   │   ├── mockData.js
│   │   └── useInventoryData.js
│   └── pages/
├── server/
│   ├── index.js               # Express server
│   ├── db.js                  # PostgreSQL connection
│   ├── setup-db.js            # Database initialization
│   └── routes/
│       ├── auth.js            # Login endpoint
│       ├── products.js        # Product CRUD endpoints
│       ├── profile.js         # Profile endpoints
│       └── dashboard.js       # Dashboard data
├── sql/
│   └── coffee_inventory_schema.sql  # Database schema
├── .env                        # Environment variables
├── package.json
└── vite.config.js
```

---

## 🔌 API Endpoints

### **Authentication**

```
POST /api/auth/login
  Body: { email, password }
  Response: { user: { id, name, role, workspace, email, memberSince } }
```

### **Products**

```
GET /api/products
  Response: { products: [{ id, name, category, unit, items, description, ... }] }

POST /api/products
  Body: { name, category, unit, items, description, updates, imageUrl }
  Response: { product: { ... } }

PUT /api/products/:id
  Body: { name, category, unit, items, description, updates, imageUrl }
  Response: { product: { ... } }

DELETE /api/products/:id
  Response: { success: true }
```

### **Profile**

```
GET /api/profile
  Response: { user: { ... } }

PUT /api/profile
  Body: { name, role, workspace }
  Response: { user: { ... } }

PUT /api/profile/email
  Body: { email, currentPassword }
  Response: { user: { ... } }

PUT /api/profile/password
  Body: { currentPassword, nextPassword }
  Response: { success: true }
```

---

## 🗄️ Environment Variables

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Aldous.txt
DB_NAME=inventory_coffee
VITE_API_URL=http://localhost:4000
```

---

## ✨ Key Features

✅ **Sidebar Navigation** - Fixed left sidebar for easy access  
✅ **Dashboard Overview** - Summary cards and recent activity  
✅ **Product Management** - Add, edit, delete products  
✅ **Image Upload** - Support for product images (JPG, PNG, WEBP)  
✅ **Search & Filter** - Quick product lookup  
✅ **Stock Reports** - Inventory analytics and insights  
✅ **User Authentication** - Secure login with bcrypt  
✅ **Profile Management** - Update account details and password  
✅ **Responsive Design** - Works on desktop and tablets  
✅ **Coffee Theme** - Warm, professional color scheme  
✅ **Simple Interface** - No unnecessary complexity

---

## 📊 Example Coffee Shop Categories

- **Coffee Beans:** Arabica, Robusta, Blends
- **Milk:** Whole, Skim, Almond, Oat, Soy
- **Syrups:** Vanilla, Caramel, Hazelnut, Mocha
- **Supplies:** Cups, Lids, Stirrers, Napkins, Sleeves
- **Other:** Sugar, Honey, Cinnamon, Cocoa Powder

---

## 🔒 Security Features

- Bcrypt password hashing
- SQL injection prevention (parameterized queries)
- CORS enabled for frontend
- Session-based authentication
- Input validation on frontend and backend

---

## 📝 Changelog

### v1.0.0 - Coffee Shop Edition

- ✅ Converted from Vapor HQ (vape) to Coffee Shop Inventory System
- ✅ Updated database schema for coffee products
- ✅ Changed fields from flavor/SKU to category/unit
- ✅ Implemented sidebar navigation
- ✅ Applied coffee-themed colors and styling
- ✅ Added sample coffee products to database
- ✅ Updated all UI components for coffee shop context

---

## 🆘 Troubleshooting

**Database Connection Issues:**

- Verify PostgreSQL is running
- Check .env file has correct credentials
- Run `npm run setup:db` to reinitialize

**Port Already in Use:**

- Change PORT in .env file
- Or kill process using the port

**CORS Errors:**

- Ensure backend is running on http://localhost:4000
- Check VITE_API_URL in .env

---

## 📞 Support

For questions or issues, ensure:

1. PostgreSQL database is running
2. Environment variables in .env are correct
3. Node.js dependencies are installed (`npm install`)
4. Backend and frontend ports are available

---

**Last Updated:** April 22, 2026  
**Database:** inventory_coffee (PostgreSQL)  
**Status:** ✅ Ready for Production
