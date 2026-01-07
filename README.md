# 🎓 Tutor Tracker

> A Next-Gen Learning Management System (LMS) designed to bridge the gap between Tutors and Students through gamification and smart learning.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)

## 📖 About The Project

**Tutor Tracker** is an interactive educational platform designed to make learning engaging and measurable.

Originally built to support a student through an **Accounting** curriculum, the platform has evolved into a versatile tool adaptable to **any subject**. It moves beyond traditional static learning by integrating **Gamification** and **Spaced Repetition** algorithms to ensure long-term retention of knowledge.

### 📸 Screenshots

| Student Dashboard | Skill Tree |
|:---:|:---:|
| ![Dashboard](./src/assets/Screenshot%202026-01-07%20alle%2012.14.48.png) | ![Roadmap](./src/assets/Screenshot%202026-01-07%20alle%2012.15.41.png) |

---

## ✨ Key Features

## Setup Instructions

### Prerequisites
- Node.js 16+ installed
- Firebase project created at https://console.firebase.google.com

### 1. Clone and Install
```bash
git clone https://github.com/MarcoGiova99/tutor.git
cd tutor-tracker
npm install
```

### 2. Firebase Configuration
1. Go to your Firebase Project Settings
2. Add a new Web App
3. Copy the Firebase configuration
4. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

5. Fill `.env` with your actual Firebase values:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Run Development
```bash
npm run dev
```

### 4. Deploy to Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

## Security Notes
- Never commit real Firebase credentials to version control
- `.env` file is included in `.gitignore`
- Use `.env.example` as template for configuration

## Architecture
- **Authentication**: Firebase Auth with role-based access
- **Database**: Firestore with real-time updates
- **Styling**: Custom CSS system with theme variables
- **State Management**: React hooks + Firebase listeners

### 👨‍🏫 For Tutors
* **Student Management**: Create, edit, and monitor student profiles.
* **Curriculum Flexibility**: Designed to support different subjects and learning paths.
* **Admin Seeding**: Tools to upload bulk questions/exercises via JSON.
* **Progress Tracking**: View detailed analytics of student performance.
* **Communication**: Shared notes system to give feedback.

### 👩‍🎓 For Students
* **Interactive Skill Tree**: Visual progression path with locked/unlocked nodes.
* **Spaced Repetition System (SRS)**: Smart review widget that resurfaces questions at optimal intervals to prevent forgetting.
* **Gamification**: Earn XP and maintain daily streaks to stay motivated.
* **Practice Arena**: Interactive exercises and quizzes to test knowledge.
* **Material Access**: Integrated PDF viewer for lecture notes.

---

## 🛠️ Tech Stack & Methodology

* **Frontend**: React.js (v18), Vite
* **Backend / DB**: Firebase Auth, Firestore
* **Routing**: React Router DOM
* **State Management**: React Hooks (Context API / Local State)
* **Animations**: Framer Motion
* **Styling**: CSS Modules / TailwindCSS
* **Development Philosophy**: **Vibe Coding** (AI-Assisted Development for rapid iteration)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v16 or higher)
* npm or yarn
* A Firebase project created on the [Firebase Console](https://console.firebase.google.com/)

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/tutor-tracker.git](https://github.com/your-username/tutor-tracker.git)
    cd tutor-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your Firebase config keys:
    ```env
    VITE_API_KEY=your_api_key
    VITE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    VITE_PROJECT_ID=your_project_id
    VITE_STORAGE_BUCKET=your_project_id.appspot.com
    VITE_MESSAGING_SENDER_ID=your_sender_id
    VITE_APP_ID=your_app_id
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

---

## 🗄️ Database Setup (Firestore)

The app uses the following collections in Firestore:
* `users`: Stores user roles (admin/tutor/student).
* `students`: Detailed profiles linking to Auth UIDs.
* `exercises`: Stores questions and quizzes.
* `upload_history`: Backup logs for Admin uploads.

> **Note:** Use the `/admin-seed` route in the app to populate the database with initial questions.

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.
>>>>>>> 40a773b1d32ca302851bfc3fa1db5eb5743ff86a
