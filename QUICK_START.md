# ☕ Coffee Shop Inventory System - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### **Step 1: Install Dependencies**

```bash
npm install
```

### **Step 2: Ensure PostgreSQL is Running**

- Make sure PostgreSQL server is running on your machine
- Database name: `inventory_coffee`
- User: `postgres`
- Password: `Aldous.txt`

### **Step 3: Initialize Database (One-time)**

```bash
npm run setup:db
```

This creates tables and adds sample coffee products.

---

## 🎯 Running the System

### **Option A: Run Backend Only**

```bash
npm run server:bg
```

✅ API runs on `http://localhost:4000`

### **Option B: Run Frontend Only**

```bash
npm run dev:client
```

✅ Frontend runs on `http://localhost:5173`

### **Option C: Run Both (Recommended)**

```bash
npm run dev
```

✅ Backend: `http://localhost:4000`  
✅ Frontend: `http://localhost:5173`

---

## 🔐 Login

**Default Admin Account:**

- **Email:** `admin@coffeeshop.com`
- **Password:** `password123`

---

## 📱 System Navigation

```
☕ Coffee Inventory System
├─ 📊 Dashboard       → View inventory overview & summary
├─ 📦 Inventory       → Manage products (Add/Edit/Delete)
├─ 📈 Reports         → Analyze stock levels
├─ 👤 Profile         → Update account settings
├─ ➕ Add Product     → Create new product
└─ 🔄 Update Stock    → Modify quantities
```

---

## 📦 Product Management

### **Add Product**

1. Click "Add Product" button
2. Fill in:
   - **Product Name** (required)
   - **Category** - e.g., "Coffee Beans", "Milk", "Syrup", "Supplies"
   - **Unit** - e.g., "kg", "liters", "pcs"
   - **Quantity** (required, numeric)
   - **Description** (optional)
   - **Image** (optional)
3. Click "Add Product" to save

### **Edit Product**

1. Go to Inventory
2. Find product in table
3. Click "Update" button
4. Modify fields
5. Click "Save Changes"

### **Delete Product**

1. Go to Inventory
2. Find product in table
3. Click "Delete" button
4. Confirm deletion

---

## 🎨 System Features

### **Dashboard**

- 📊 4 Summary cards (Total Products, Total Stock, Low Stock, Out of Stock)
- 🔍 Search bar for quick lookup
- 📋 Product table with pagination
- 👁️ View product details

### **Inventory**

- 📦 Full product list
- ➕ Add new products
- ✏️ Edit existing products
- 🗑️ Delete products
- 🖼️ Product image support
- 📄 Pagination (10 items per page)

### **Reports**

- 📊 Summary statistics
- 📈 Highest quantity items
- ⚠️ Low & out-of-stock alerts
- 📝 Recent activity updates

### **Profile**

- 👤 View account information
- ✏️ Update profile details
- 📧 Change email
- 🔑 Change password

---

## 📊 Sample Coffee Products

Database includes 8 sample products:

| Product         | Category     | Unit   | Quantity |
| --------------- | ------------ | ------ | -------- |
| Arabica Beans   | Coffee Beans | kg     | 25.50    |
| Robusta Beans   | Coffee Beans | kg     | 15.75    |
| Whole Milk      | Milk         | liters | 40.00    |
| Almond Milk     | Milk         | liters | 12.50    |
| Vanilla Syrup   | Syrup        | liters | 8.00     |
| Caramel Syrup   | Syrup        | liters | 6.50     |
| Paper Cups      | Supplies     | pcs    | 500      |
| Wooden Stirrers | Supplies     | pcs    | 1000     |

---

## 🔧 Configuration

### **.env File**

```env
PORT=4001                          # Backend port
DB_HOST=localhost                  # Database host
DB_PORT=5432                       # PostgreSQL port
DB_USER=postgres                   # Database user
DB_PASSWORD=Aldous.txt            # Database password
DB_NAME=inventory_coffee          # Database name
VITE_API_URL=http://localhost:4001 # API URL for frontend
```

### **Change Backend Port**

Edit `.env`:

```env
PORT=5000  # Now runs on http://localhost:5000
```

---

## 🆘 Troubleshooting

### ❌ "Cannot connect to database"

**Solution:**

- Check PostgreSQL is running
- Verify credentials in `.env`
- Run `npm run setup:db`

### ❌ "Port 4000 already in use"

**Solution:**

- Change PORT in `.env`
- Or kill the process using: `lsof -ti:4000 | xargs kill -9`

### ❌ "Cannot find module 'dotenv'"

**Solution:**

```bash
npm install
```

### ❌ "API not responding"

**Solution:**

- Ensure backend is running: `npm run server:bg` or `npm run dev`
- Check terminal for error messages
- Verify port 4001 is accessible

---

## 🎯 Common Tasks

### **Add Coffee Beans to Inventory**

1. Click "Add Product"
2. **Product Name:** Arabica Beans
3. **Category:** Coffee Beans
4. **Unit:** kg
5. **Quantity:** 50
6. **Description:** Premium single-origin arabica
7. Click "Add Product"

### **Check Low Stock Items**

1. Go to "Reports"
2. Look at "Low & Out of Stock" section
3. Items with quantity ≤ 20 appear here

### **Search for Product**

1. Use search bar in Dashboard or Inventory
2. Type product name, category, or unit
3. Results update in real-time

### **Change Password**

1. Go to "Profile"
2. Scroll to "Update Password" section
3. Enter current password
4. Enter new password (2x)
5. Click "Update Password"

---

## 📚 File Structure Overview

```
.env                        # Configuration (passwords, ports, etc.)
package.json               # Dependencies & scripts
src/
  ├── App.jsx              # Main app logic
  ├── components/
  │   └── AppShell.jsx     # Sidebar layout
  └── index.css            # Styling (coffee theme)
server/
  ├── index.js             # Express server
  ├── db.js                # Database connection
  ├── setup-db.js          # Database setup
  └── routes/
      ├── auth.js          # Login
      ├── products.js      # Product endpoints
      └── profile.js       # Account endpoints
sql/
  └── coffee_inventory_schema.sql  # Database schema
```

---

## 🚨 Important Notes

⚠️ **Default Password:** Change `password123` after first login  
⚠️ **Database Backup:** Regularly backup your PostgreSQL database  
⚠️ **Images:** Large images may slow down the system  
⚠️ **Browser Support:** Use modern browsers (Chrome, Firefox, Safari, Edge)

---

## 📞 Quick Reference

| Task           | Command              |
| -------------- | -------------------- |
| Install deps   | `npm install`        |
| Setup database | `npm run setup:db`   |
| Start backend  | `npm run server:bg`  |
| Start frontend | `npm run dev:client` |
| Run both       | `npm run dev`        |
| Build          | `npm run build`      |
| Lint code      | `npm run lint`       |

---

## ✅ System Ready!

Your Coffee Shop Inventory System is now ready to use!

- **Backend:** http://localhost:4001
- **Frontend:** http://localhost:5173
- **Login:** admin@coffeeshop.com / password123
- **Database:** inventory_coffee

☕ **Happy inventory tracking!**

---

**Last Updated:** April 22, 2026
