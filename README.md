# AtomSync 

AtomSync is a minimalist, desktop-first web application that provides an intuitive platform for organizations to manage, track, and approve employee goals with seamless role-based access control.

## 🚀 Key Features
- **Role-Based Access Control:** Distinct workflows and dashboards for Employees, Managers, and Admins.
- **Dynamic Dashboards:** Real-time visualizations of goal progress, weight allocations, and team summaries using Recharts.
- **Modern Minimalist UI:** A crisp, data-dense desktop aesthetic featuring a floating TopNav and a built-in **Dark/Light Mode** toggle.
- **Supabase Integration:** Fully integrated with Supabase for PostgreSQL data storage and secure Email/Password authentication.

---

## 🔐 Quick Login (Demo)

To make testing the application as smooth as possible I've built a "stealth bypass" into the login screen. 

You do **not** need to sign up or confirm your email. Simply enter the following credentials on the Login screen, and the system will instantly bypass authentication and log you into the respective mocked role:

**Employee Journey**
- **Email:** `employee@atomquest.com`
- **Password:** `Demo123!`

**Manager Journey**
- **Email:** `manager@atomquest.com`
- **Password:** `Demo123!`

**Admin Journey**
- **Email:** `admin@atomquest.com`
- **Password:** `Demo123!`

---

## 🔒 Real Authentication

The application is fully integrated with **Supabase Auth**. If you wish to test the live authentication flow:
1. Enter a valid email and click **Sign Up**.
2. Supabase will provision a real user account in the backend.
3. *Note: You must have Email Confirmations disabled in your Supabase dashboard, or you will need to click the verification link sent to your email before you can log in.*

---

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Visualizations:** Recharts, Lucide React (Icons)
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment:** Vercel

## 💻 Running Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by creating a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Architecture
The architecture is designed for scalability, utilizing Next.js for server/client rendering and Supabase for a robust backend. An architecture diagram has been generated in mermaid format and is included in the project files.
