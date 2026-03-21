# SESWA Backend

This is the Express backend for the SESWA WB 22nd Registration System.

## Setup

1.  **Install Dependencies:**
    ```bash
    cd backend
    npm install
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env` and fill in the values.
    ```bash
    cp .env.example .env
    ```

3.  **Firebase Service Account:**
    - Go to Firebase Console -> Project Settings -> Service Accounts.
    - Click "Generate new private key".
    - Copy the contents of the JSON file.
    - Set `FIREBASE_SERVICE_ACCOUNT` in your environment variables to the JSON string.

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## Deployment on Render

1.  **Create a new Web Service on Render.**
2.  **Connect your GitHub repository.**
3.  **Root Directory:** `backend`
4.  **Build Command:** `npm install && npm run build`
5.  **Start Command:** `npm start`
6.  **Environment Variables:** Add all variables from `.env.example` to Render's environment variables.
    - `FIREBASE_SERVICE_ACCOUNT`: Paste the entire JSON string from your service account file.
    - `FRONTEND_URL`: Set this to your frontend's URL (e.g., `https://your-app.vercel.app`).
