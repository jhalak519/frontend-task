# TaskFlow - MERN Stack Task Management App

A full-stack task management application built with the MERN stack (MongoDB, Express, React, Node.js). It features secure user authentication, a responsive dashboard, and real-time task statistics.

##  Features

*   **User Authentication**: Secure registration and login using JWT (JSON Web Tokens).
*   **Task Management**:
    *   Create, Read, Update, and Delete (CRUD) tasks.
    *   Categorize tasks by status (Pending, In Progress, Completed).
    *   Set priority levels (Low, Medium, High).
    *   Set due dates.
*   **Dashboard**:
    *   Overview statistics (Total, Pending, In Progress, Completed).
    *   Filter tasks by status.
    *   Sort tasks by Date, Priority, or Due Date.
    *   Search functionality.
    *   Pagination support.
*   **Bulk Actions**: Select multiple tasks to delete or update status in bulk.
*   **Responsive Design**: Built with Tailwind CSS for mobile-friendly usage.
*   **Security**: Password hashing with bcrypt, input validation, and protected routes.

##  Tech Stack

Client:
*   React (Vite)
*   Tailwind CSS
*   React Router v6
*   Axios
*   React Toastify (Notifications)
*   Lucide React (Icons)

Server:
*   Node.js
*   Express
*   MongoDB (Mongoose)
*   JWT & Bcrypt (Auth)
*   Cors

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas Account (or local MongoDB)

### 1. Clone the repository
```bash
git clone <repository-url>
cd frontend-task
```

### 2. Server Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the server:
```bash
npm run dev
# Server runs on http://localhost:5001
```

### 3. Client Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5001/api
```

Start the client development server:
```bash
npm run dev
# Client runs on http://localhost:5173
```

##  API Endpoints

### Authentication
*   `POST /api/auth/register` - Register a new user
*   `POST /api/auth/login` - Login user & get token
*   `GET /api/auth/me` - Get current logged-in user info

### Tasks
*   `GET /api/tasks` - Get all tasks (supports pagination, sorting, filtering)
*   `POST /api/tasks` - Create a new task
*   `PUT /api/tasks/:id` - Update a task
*   `DELETE /api/tasks/:id` - Delete a task
*   `POST /api/tasks/bulk-delete` - Bulk delete tasks
*   `PUT /api/tasks/bulk-status` - Bulk update task status

##  Deployment (Vercel)

This project is configured for Vercel deployment.

1. Server: Deploy the `server` directory.
    *   Set build command to `npm install`.
    *   Set start command to `node server.js`.
    *   Add environment variables (`MONGO_URI`, `JWT_SECRET`).
    *   Ensure `vercel.json` is present for configuration.

2. Client : Deploy the `client` directory.
    *   Framework preset: Vite.
    *   Add environment variable `VITE_API_URL` pointing to your deployed server URL (e.g., `https://your-server.vercel.app/api`).

##  Troubleshooting

1. MongoDB Connection Error: Ensure your IP is whitelisted in MongoDB Atlas Network Access (allow `0.0.0.0/0` for Vercel).
2. CORS Issues: Check `server.js` CORS configuration to allow your client domain.
