# Facial Recognition Logbook Web Application

A modern web-based attendance system that uses **facial recognition** to automate and streamline attendance logging. The application is built with **Next.js**, **Supabase**, and **face-api.js**, providing a secure, contactless, and efficient alternative to traditional manual or biometric methods.

---

## 🚀 Features

- **Admin Authentication**
  - Secure login with JWT-based session management
  - Admin dashboard for system management

- **User Management**
  - Register new users with profile image
  - Face encoding generated and stored using `face-api.js`
  - Manage and delete existing users

- **Attendance Management**
  - Real-time face recognition via webcam
  - Automatic attendance marking with confidence scores
  - View, edit, or delete attendance records by date

- **System Security**
  - JWT for authentication
  - Supabase storage for profile images
  - Input validation to prevent duplicate or invalid registrations

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database & Storage**: Supabase (PostgreSQL + Storage)
- **Face Recognition**: face-api.js (TensorFlow.js-based models)
- **Authentication**: JSON Web Tokens (JWT)

---

## ⚙️ How It Works

1. **Admin Login** – Admin authenticates securely via the login portal.
2. **User Registration** – Admin uploads a user’s profile image → face encoding is extracted → user data is stored in Supabase.
3. **Face Scanning** – Users appear in front of a webcam → system detects and matches face with stored encodings.
4. **Attendance Marking** – If a match is found, attendance is logged with timestamp and confidence score.
5. **Admin Dashboard** – Admins can view daily logs, update records, and manage user/admin accounts.

---

## 📂 Project Structure

```
suryaakkala-facial-recognition-logbook-webapp/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/              # Backend API endpoints
│   └── camtest/          # Camera testing page
├── components/           # UI and custom React components
├── hooks/                # Reusable React hooks
├── lib/                  # Face recognition logic & Supabase config
├── public/models/        # Pre-trained face-api.js models
├── scripts/              # Database setup & seed scripts
├── styles/               # Global CSS
└── package.json          # Dependencies & scripts
```

---

## 🖥️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/suryaakkala/facial-recognition-logbook-webapp.git
   cd facial-recognition-logbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**  
   Create a `.env.local` file and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   JWT_SECRET=your-secret-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the app**  
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔮 Future Improvements

- Multi-admin role support with fine-grained permissions
- Attendance analytics and reporting
- Mobile-friendly user attendance scanner
- Integration with external HR or academic systems

---

## 👨‍💻 Author

**A. Surya Venkata Deepak**  
Final-year B.Tech (CSE) @ KL University  
[GitHub](https://github.com/suryaakkala) | [LinkedIn](https://www.linkedin.com/in/suryaakkala/)
