# BlogSpace — Blog Platform with Comments

A beginner-friendly full-stack blogging app built with **HTML, CSS, JavaScript, Node.js, Express, MongoDB, and JWT authentication**.

## Features
- Register and log in
- Passwords hashed with bcrypt
- Create, edit, and delete your own posts
- Read posts from all users
- Add comments to posts while logged in
- REST API and MongoDB persistence
- Responsive layout

## Requirements
Install Node.js (LTS) and MongoDB Community Server, or use a MongoDB Atlas connection string.

## Run locally
1. Extract this project folder.
2. Open a terminal inside `blog-platform-comments`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to a new file named `.env`.
5. In `.env`, set `MONGODB_URI` to your local MongoDB URI or Atlas connection string. Change `JWT_SECRET` to a long random string.
6. Start MongoDB if you are using a local database.
7. Start the app:
   ```bash
   npm start
   ```
8. Open `http://localhost:5000`.

## Main API endpoints

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Log in | No |
| GET | `/api/posts` | List posts and comments | No |
| POST | `/api/posts` | Create post | Yes |
| PUT | `/api/posts/:id` | Edit own post | Yes |
| DELETE | `/api/posts/:id` | Delete own post | Yes |
| POST | `/api/posts/:id/comments` | Add comment | Yes |
| GET | `/api/health` | Check server status | No |

## Quick test checklist
- Register a new account.
- Log out and log in again.
- Publish a post.
- Edit the post and save.
- Add a comment.
- Delete your post.
- Register a second account and verify that it cannot edit/delete the first user's post.

## Notes
- Never commit `.env` or real credentials to GitHub.
- This is a learning/demo project. Before production deployment, add rate limiting, stronger validation, and a more robust token storage strategy.
