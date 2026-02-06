# Trello Clone

A full-stack Trello-like project management application with drag-and-drop functionality.

## Features

- 🔐 **Authentication**: JWT-based user registration and login
- 📋 **Boards**: Create and manage multiple boards
- 📝 **Lists**: Organize tasks in customizable lists
- 🎯 **Cards**: Create, edit, and delete task cards
- 🖱️ **Drag & Drop**: Intuitive card reordering and movement between lists
- 👥 **Collaboration**: Invite team members to boards

## Tech Stack

### Frontend
- React 19
- Vite
- TailwindCSS
- @dnd-kit (Drag and Drop)
- Axios
- React Router

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally on port 27017)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/Zaini8500/trello-web.git
cd trello-web
```

### 2. Install server dependencies
```bash
cd server
npm install
```

### 3. Install client dependencies
```bash
cd ../client
npm install
```

### 4. Configure environment variables

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="mongodb://localhost:27017/trello-clone"
JWT_SECRET=your_secret_key_here
PORT=5001
```

## Running the Application

### Start MongoDB
Make sure MongoDB is running on your local machine.

### Start the backend server
```bash
cd server
npm run dev
```
The server will run on `http://localhost:5001`

### Start the frontend
```bash
cd client
npm run dev
```
The client will run on `http://localhost:5173`

## Usage

1. Open `http://localhost:5173` in your browser
2. Register a new account
3. Create a new board
4. Add lists to your board
5. Create cards within lists
6. Drag and drop cards to reorder or move between lists

## Project Structure

```
trello-web/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utility functions
│   └── package.json
│
└── server/                # Node.js backend
    ├── src/
    │   ├── config/        # Database configuration
    │   ├── middleware/    # Express middleware
    │   ├── models/        # Mongoose models
    │   └── routes/        # API routes
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Boards
- `GET /api/boards` - Get all boards for user
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get single board with lists and cards
- `POST /api/boards/:id/invite` - Invite member to board

### Lists
- `POST /api/boards/:id/lists` - Create new list
- `DELETE /api/boards/lists/:listId` - Delete list

### Cards
- `POST /api/boards/:id/lists/:listId/cards` - Create new card
- `PUT /api/boards/cards/:cardId` - Update card (move/edit)
- `DELETE /api/boards/cards/:cardId` - Delete card

## License

MIT

## Author

Zain Tahir
