# Stock ERP Backend API

Node.js + Express backend API for the Stock ERP system with PostgreSQL database.

## Requirements

- Node.js >= 14.x
- PostgreSQL >= 12
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
copy .env.example .env
```

3. Update `.env` with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_erp
DB_USER=postgres
DB_PASSWORD=your_password
PORT=8000
FRONTEND_URL=http://localhost:3000
```

4. Create PostgreSQL database:
```sql
CREATE DATABASE stock_erp;
```

5. Run migrations to create tables:
```bash
npm run migrate
```

6. (Optional) Seed sample data:
```bash
npm run seed
```

Or run both at once:
```bash
npm run setup
```

7. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create a category
- `GET /api/categories/:id` - Get a category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create a supplier
- `GET /api/suppliers/:id` - Get a supplier
- `PUT /api/suppliers/:id` - Update a supplier
- `DELETE /api/suppliers/:id` - Delete a supplier

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create a product
- `GET /api/products/:id` - Get a product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `POST /api/products/:id/adjust-stock` - Adjust product stock

### Purchase Orders
- `GET /api/purchase-orders` - List all purchase orders
- `POST /api/purchase-orders` - Create a purchase order
- `GET /api/purchase-orders/:id` - Get a purchase order
- `PUT /api/purchase-orders/:id` - Update a purchase order
- `DELETE /api/purchase-orders/:id` - Delete a purchase order
- `POST /api/purchase-orders/:id/receive` - Receive a purchase order (updates stock)

### Purchase Order Lines
- `GET /api/purchase-order-lines` - List all purchase order lines
- `POST /api/purchase-order-lines` - Create a purchase order line
- `GET /api/purchase-order-lines/:id` - Get a purchase order line
- `PUT /api/purchase-order-lines/:id` - Update a purchase order line
- `DELETE /api/purchase-order-lines/:id` - Delete a purchase order line

### Stock Movements
- `GET /api/stock-movements` - List all stock movements
- `POST /api/stock-movements` - Create a stock movement
- `GET /api/stock-movements/:id` - Get a stock movement
- `PUT /api/stock-movements/:id` - Update a stock movement
- `DELETE /api/stock-movements/:id` - Delete a stock movement

## Data Format

The API accepts both camelCase and snake_case formats for request data. Responses are always in camelCase format with string IDs to match frontend expectations.

**Example Product Request:**
```json
{
  "name": "Product Name",
  "sku": "SKU-001",
  "categoryId": "1",
  "supplierId": "1",
  "purchasePrice": 100,
  "salePrice": 150,
  "quantity": 10,
  "unit": "unité",
  "minStock": 5
}
```

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection
├── controllers/           # Request handlers
├── models/                # Database models/queries
├── routes/                # API routes
├── middleware/            # Custom middleware
├── scripts/               # Migration and seed scripts
├── server.js              # Main server file
└── package.json
```

## CORS Configuration

CORS is configured to allow requests from the frontend URL specified in `.env` (default: `http://localhost:3000`).

## Error Handling

The API includes error handling middleware that:
- Handles database constraint violations
- Returns appropriate HTTP status codes
- Provides error messages in a consistent format

## Development

- Use `npm run dev` for development with nodemon (auto-reload)
- Check logs in the console for requests and errors

