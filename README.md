# Sweety – Blood Glucose Tracker

A clean, modern, and reliable full-stack web application designed for diabetes patients to record up to 4 daily blood glucose readings, track historical trends, and generate comprehensive daily, month-to-date, and monthly clinical reports.

---

## 1. Project Description

**Sweety** is built to help patients monitor their diabetes efficiently and accurately. Users can record blood glucose readings across four distinct daily slots (`Morning (fasting)`, `After breakfast`, `After lunch`, and `After dinner`). The app strictly enforces validation rules, prevents duplicate time slots per day, enforces a maximum of four readings per day, and calculates statistical reports (highest, lowest, average, and total counts) using PostgreSQL aggregate functions.

---

## 2. Technologies Used

### Frontend
- **React.js (v18)**: Component-based UI library
- **Vite**: Ultra-fast build tool and development server
- **JavaScript (ES6+)**: Clean, understandable vanilla JavaScript (no TypeScript)
- **React Router DOM (v6)**: Client-side routing with route guards (`ProtectedRoute`)
- **Axios**: HTTP client for RESTful API communication with JWT interceptors
- **Recharts**: Data visualization library for monthly blood glucose trends
- **Custom CSS**: Responsive healthcare-themed styling (white background, soft pink & purple accents)

### Backend
- **Node.js**: Asynchronous JavaScript runtime
- **Express.js**: REST API server framework
- **PostgreSQL**: Relational database for transactional integrity
- **pg (node-postgres)**: Direct PostgreSQL client with connection pooling and transactions
- **bcryptjs**: Secure password hashing with salts
- **JSON Web Token (JWT)**: Stateless token-based user authentication
- **dotenv**: Environment variable management
- **cors**: Cross-Origin Resource Sharing middleware

### Testing & Quality Assurance
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertions for Express endpoints
- **pg-mem**: In-memory PostgreSQL engine for isolated, zero-dependency testing

---

## 3. Completed Features

### Feature 1: Authentication & User Isolation
- User registration with validation and unique email enforcement.
- Password hashing with bcrypt before database persistence.
- JWT-authenticated login with token storage and automatic authorization header injection.
- Session persistence and protected frontend route guards (`/login`, `/register`, `/`).
- Complete user data isolation: each patient can strictly access, edit, and delete only their own records.

### Feature 2: Complete CRUD for Blood Glucose Readings
- **Add Reading**: Form with automatic today date default, time slot dropdown, and numeric glucose input.
- **View Readings**: Chronological table displaying Date, Time Slot, Glucose Value (mg/dl), status pills (Low, Normal, High), and Actions.
- **Edit Reading**: Pre-populates selected reading into the form, with update and cancel capabilities.
- **Delete Reading**: Deletes entry after a user confirmation prompt.

### Exact Validation Rules Enforced (Frontend & Backend)
1. **Value Required**: `"Please enter a glucose value."`
2. **Value Range**: `"Value must be between 40 and 600 mg/dl."` (rejects decimals, non-integers, negative numbers, and out-of-range values).
3. **Unique Slot per Day**: `"You already have an After lunch reading for this date."` / `"You already have a Morning (fasting) reading for this date."` (with dynamic vowel article handling).
4. **Max 4 Readings per Day**: `"You can add only 4 readings per day."` (enforced with database transactions).
5. **No Future Dates**: `"Date cannot be in the future."`

### Feature 3: Clinical Reports & Aggregations
- **Daily Report**: Shows highest, lowest, average (rounded to 1 decimal), total readings, and a list of all readings for the selected date.
- **Month-to-Date Report**: Calculates statistics from the 1st of the month to the selected date.
- **Monthly Report (Previous Month)**: Accurately calculates statistics for the entire previous calendar month, safely handling year and month rollovers.
- **Empty States**: Shows `"No glucose readings found for this date."` or `"No glucose readings found for this period."` when no records exist.
- **Bonus Feature**: Interactive line chart displaying previous month daily average glucose levels against standard target thresholds (70–140 mg/dl).

---

## 4. Project Structure

```
sweety/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ReadingForm.jsx
│   │   │   ├── ReadingList.jsx
│   │   │   ├── ReportCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── readingController.js
│   │   └── reportController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── readingRoutes.js
│   │   └── reportRoutes.js
│   │
│   ├── tests/
│   │   ├── auth.test.js
│   │   └── reading.test.js
│   │
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── README.md
└── .gitignore
```

---

## 5. Prerequisites

Before running the application, make sure you have installed:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** (v14.0 or higher)

---

## 6. Installation & Database Setup

### Step 1: Install Dependencies
Open a terminal in the root directory:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Database Setup (PostgreSQL)
1. Open PostgreSQL command line (`psql`) or pgAdmin:
   ```sql
   CREATE DATABASE sweety_db;
   ```
2. Execute the schema file against `sweety_db`:
   ```bash
   psql -U postgres -d sweety_db -f server/database/schema.sql
   ```

### Step 3: Environment Setup
Inside the `server/` directory, create a `.env` file based on `.env.example`:

```bash
cd server
cp .env.example .env
```

Ensure the configuration matches your local PostgreSQL credentials:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sweety_db
JWT_SECRET=sweety_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Step 4: Seed the Database
Run the seed script to create the Demo account with realistic sample readings across current and previous months:

```bash
cd server
npm run seed
```

---

## 7. Running the Application

### Running the Backend Server
From the `server/` directory:
```bash
npm start
# or for live reloading during development:
npm run dev
```
The server will start on `http://localhost:5000`.

### Running the Frontend Client
From the `client/` directory:
```bash
npm run dev
```
The client will start on `http://localhost:5173`. Open this URL in your web browser.

---

## 8. Running Automated Tests

The test suite contains 21 unit and integration tests covering authentication, all five validation rules, concurrency limit enforcement, user isolation, and clinical report aggregations.

Run tests from the `server/` folder:
```bash
cd server
npm test
```

> **Note:** Tests use an isolated, in-memory PostgreSQL emulator (`pg-mem`) loaded with `schema.sql`. You can execute `npm test` immediately without needing an active PostgreSQL service.

---

## 9. Demo Credentials

You can log in immediately using the seeded demo account or by clicking the **"Fill Demo"** button on the Login page:
- **Email:** `demo@sweety.com`
- **Password:** `Demo@123`

---

## 10. API Endpoints Documentation

All response bodies follow a consistent JSON structure:
- **Success:** `{ "success": true, "message": "...", "data": { ... } }`
- **Error:** `{ "success": false, "message": "..." }`

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Login user and issue JWT | No |
| `GET` | `/api/auth/me` | Get current logged-in profile | Yes (Bearer Token) |

### Readings Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/readings` | Add a new glucose reading | Yes |
| `GET` | `/api/readings` | Get all readings for current user | Yes |
| `GET` | `/api/readings/:id` | Get a single reading by ID | Yes |
| `PUT` | `/api/readings/:id` | Update an existing reading | Yes |
| `DELETE` | `/api/readings/:id` | Delete a reading | Yes |

*Optional query parameters supported on `GET /api/readings`: `?page=1&limit=20` (Bonus pagination).*

### Reports Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Highest, lowest, average, count & slot listing for date | Yes |
| `GET` | `/api/reports/month-to-date?date=YYYY-MM-DD` | Statistics from 1st of month to date | Yes |
| `GET` | `/api/reports/monthly?date=YYYY-MM-DD` | Statistics for the full previous month | Yes |

---

## 11. Assumptions & Future Enhancements

### Assumptions
- A user can log up to 4 readings per day corresponding to the 4 fixed clinical slots: `Morning (fasting)`, `After breakfast`, `After lunch`, and `After dinner`.
- Blood glucose is measured in mg/dl as whole numbers between 40 and 600.
- Dates are stored as standard `DATE` types (`YYYY-MM-DD`), preventing timezone drift across client and server.

### Future Improvements
1. **Push & Email Notifications**: Automated reminders if a patient hasn't logged their readings by evening.
2. **Export Functionality**: One-click PDF or CSV export for sharing reports directly with consulting endocrinologists.
3. **Doctor Portal**: Role-based access control (RBAC) allowing medical professionals to monitor patient readings remotely.
