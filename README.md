# FixMyCampus — Full Project Structure

This archive contains the planned folder architecture and placeholder files for the combined frontend + backend project. It is NOT a fully implemented application yet.

## Frontend
- `client/`: React + Vite + Tailwind CSS
- Pages for landing, authentication, student, admin, staff, suggestions and analytics
- `client/src/services/`: future API calls to the backend

## Backend
- `server/`: Node.js + Express + MongoDB/Mongoose
- `server/src/models/`: database schemas
- `server/src/controllers/`: request handling
- `server/src/routes/`: API route definitions
- `server/src/middleware/`: authentication and role authorization
- `server/src/services/`: AI and notification logic

## Before running
1. Create the React app in `client` using Vite if it does not already exist.
2. Install frontend dependencies from the frontend instructions we will use in the chat.
3. Run `npm init -y` inside `server` and install Express/Mongoose and other packages when we implement backend.
4. Add environment variables to local `.env` files; never commit real secrets.
5. This archive has placeholders only; pages and APIs will be implemented incrementally.
