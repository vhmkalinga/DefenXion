# DefenXion: Network Intrusion Detection System

**University Final Year Project**

DefenXion is a Machine Learning-based Intrusion Detection System (IDS) developed to analyze network traffic and detect anomalous threats using algorithms such as Random Forest and Gradient Boosting. The system features a backend threat analysis engine, simulated response mechanisms, and a web-based dashboard for interacting with network alerts and data.

## System Architecture

The project consists of four main educational components:
1. **Backend API (FastAPI)** - Handles user authentication, runs predictions on the dataset, facilitates continuous model training, interacts with the MongoDB database, and drives the active defense response logic and PCAP engine.
2. **Frontend UI (React + Vite)** - A simple but elegant dashboard for viewing threat analytics, managing alerts, evaluating model accuracy, and monitoring network traffic simulations.
3. **Mobile Companion App (React Native/Expo)** - A mobile application built for remote monitoring of real-time alerts, system analytics, and active defense logs directly from your smartphone.
4. **Machine Learning Pipeline** - Built on the CICIDS2017 dataset, implementing multiple classifiers, feature processing, and scikit-learn models.

## Features

- **Network Traffic Analysis**: Evaluates network packets using an ML model to determine anomalous behavior, capturing live traffic via the integrated PCAP engine.
- **Active Defense Simulation**: Simulates and automates blocking of malicious IP addresses using local firewall rules (`netsh`) and alerting administrators based on the confidence scores from the ML classifiers.
- **Security Copilot AI**: Features an integrated LLM-powered chatbot to assist administrators with threat querying, mitigation strategies, and system insights.
- **Model Training Integration**: Allows retraining ML models directly from the UI to demonstrate lifecycle capabilities.
- **Visual Analytics**: Displays geospatial attack source data, live network graphs, and real-time traffic statistics.
- **User Authentication**: Simple login using JWT authentication across web and mobile.

---

## Directory Structure
- `backend/` - FastAPI backend application containing the core algorithms, ML inferences, PCAP capture engine, and routing.
- `ui/dashboard/` - Frontend React single-page application created using Vite.
- `ui/mobile/` - React Native mobile companion app built with Expo.
- `datasets/` - Contains sample data from the CICIDS2017 dataset used for testing and training.
- `models/` - Directory storing the serialized/pickled trained ML models (`.pkl` files).
- `scripts/` - Utility scripts (e.g., initial test user creation, confusion matrix generators).
- `defenxion_technical_report.md` - Comprehensive final project report.

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MongoDB Database** (running locally or via Atlas)

---

## Installation & Setup

### 1. Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Configure Environment:**
   Create a `.env` file in the root directory and configure your MongoDB URI.
   ```env
   MONGODB_URI=mongodb://localhost:27017/defenxion
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```
3. **Run Initial Database Scripts:**
   Optionally run the following to create the admin profile to test login functionality:
   ```bash
   python scripts/create_admin.py
   ```
4. **Run the Backend Server:**
   The backend must be run using `uvicorn` (from the root directory):
   ```bash
   uvicorn backend.main:app --reload
   ```

### 2. Frontend Setup

1. **Navigate to the dashboard directory:**
   ```bash
   cd ui/dashboard
   ```
2. **Install Node dependencies:**
   ```bash
   npm install
   ```
3. **Run the Vite Development Server:**
   ```bash
   npm run dev
   ```

### 3. Mobile App Setup

1. **Navigate to the mobile directory:**
   ```bash
   cd ui/mobile
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the Expo server:**
   ```bash
   npx expo start
   ```

### 4. Alternative Quick-Start

You can execute both web servers automatically by double-clicking the `start.bat` file in the root directory if you are on Windows.

**Note for Active Defense:** If you wish to test the live IP blocking feature which manipulates Windows Firewall (`netsh`), you must start the application using `start_admin.bat`. This launcher will automatically request the necessary elevated Administrator privileges.

---

## Acknowledgements
- Dataset used in this project: [CICIDS2017](https://www.unb.ca/cic/datasets/ids-2017.html)
- Main libraries: `scikit-learn`, `FastAPI`, `React`
