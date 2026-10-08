# 🏫 School Management System

A comprehensive full-stack **School Management System** built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and **PostgreSQL** as the database. This application streamlines school operations including teacher management, student records, class scheduling, attendance tracking, and fee management.

## ✨ Features

### 👨‍💼 Admin Dashboard
- Secure admin authentication with JWT
- Admin limit enforcement (max 2 admins)
- SHA-256 password encryption with salt

### 👨‍🏫 Teacher Management
- Add, edit, and delete teachers
- Assign subjects and classes
- Teacher profiles with contact information

### 👨‍🎓 Student Management
- Student enrollment and records
- Class and section assignment
- Academic history tracking

### 📚 Class & Subject Management
- Create and manage classes
- Assign subjects to classes
- Schedule management

### 📅 Timetable Management
- Create and manage timetables
- Teacher-class-subject mapping
- Conflict detection

### 📊 Attendance Tracking
- Mark student attendance
- Generate attendance reports
- Track attendance history

### 💰 Fee Management
- Fee structure management
- Fee collection tracking
- Payment history

### 📢 Notifications
- Announcements system
- Email notifications
- Real-time updates

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP Client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **TypeScript** - Type Safety
- **JWT** - Authentication
- **bcrypt** - Password Hashing

### Database
- **PostgreSQL** - Relational Database
- **pg** - PostgreSQL client for Node.js
- **Prisma ORM** or **TypeORM** - Database ORM

### Tools & DevOps
- **pnpm** - Package Manager
- **Vercel** - Frontend Deployment
- **Render** - Backend Deployment
- **Git** - Version Control

---

## 🗄️ Database Schema (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
