# DefenXion: Network Intrusion Detection System

**University Final Year Project**

DefenXion is a Machine Learning-based Intrusion Detection System (IDS) developed to analyze network traffic and detect anomalous threats using algorithms such as Random Forest and Gradient Boosting. The system features a backend threat analysis engine, simulated response mechanisms, and a web-based dashboard for interacting with network alerts and data.

## System Architecture

The project consists of three main educational components:
1. **Backend API (FastAPI)** - Handles user authentication, runs predictions on the dataset, facilitates continuous model training, interacts with the MongoDB database, and drives the response logic.
2. **Frontend UI (React + Vite)** - A simple but elegant dashboard for viewing threat analytics, managing alerts, evaluating model accuracy, and monitoring network traffic simulations.
3. **Machine Learning Pipeline** - Built on the CICIDS2017 dataset, implementing multiple classifiers, feature processing, and scikit-learn models.

## Features

- **Network Traffic Analysis**: Evaluates network packets using an ML model to determine anomalous behavior.
- **Response Simulation**: Simulates blocking IP addresses and alerting administrators based on the confidence scores from the ML classifiers.
- **Model Training Integration**: Allows retraining ML models directly from the UI to demonstrate lifecycle capabilities.
- **Visual Analytics**: Displays geospatial attack source data and real-time traffic statistics.
- **User Authentication**: Simple login using JWT authentication.

---

## Directory Structure
- `backend/` - FastAPI backend application containing the core algorithms, ML inferences, and routing.
- `ui/dashboard/` - Frontend React single-page application created using Vite.
- `datasets/` - Contains sample data from the CICIDS2017 dataset used for testing and training.
- `models/` - Directory storing the serialized/pickled trained ML models (`.pkl` files).
- `scripts/` - Utility scripts (e.g., initial test user creation).

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

### 3. Alternative Quick-Start

You can execute both servers automatically by double-clicking the `start.bat` file in the root directory if you are on Windows.

---

## Acknowledgements
- Dataset used in this project: [CICIDS2017](https://www.unb.ca/cic/datasets/ids-2017.html)
- Main libraries: `scikit-learn`, `FastAPI`, `React`
