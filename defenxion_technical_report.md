# DefenXion – Final Technical Report & Implementation Details

This document provides a comprehensive, implementation-level breakdown of the **DefenXion: AI-Powered Cyber Threat Detection and Automated Response System** project. The information within is deeply technical, extracting actual codebase logic, database schemas, and architectural designs used during development.

---

## 1. FULL SYSTEM OVERVIEW

**Overall Project Workflow:**
DefenXion operates as an end-to-end security pipeline. Network traffic (via live capture or imported PCAP files) is ingested and parsed by the system's Deep Packet Inspection (DPI) engine. Flow-level features are extracted and immediately pushed to a FastAPI backend. The machine learning engine loads a serialized Scikit-learn model into memory, evaluates the flow, and assigns a threat probability. If a threat is detected, the event is passed to the Automated Response Engine, which logs the threat in MongoDB, broadcasts a real-time WebSocket alert to the React dashboard, and optionally executes a simulated host-based firewall block (Windows `netsh`) and dispatches email/Slack notifications.

**End-to-End Data Flow:**
1. **Ingestion**: Raw traffic/PCAP -> Scapy DPI extraction (features).
2. **Inference**: FastAPI `/predict` or `/pcap/analyze` -> Model Registry -> Scikit-learn `predict()`.
3. **Decision Pipeline**: Threat detected -> MongoDB Detections Collection -> Threat Scoring.
4. **Action**: Automated Response Engine -> Evaluates sensitivity thresholds -> Logs / Alerts / Blocks.
5. **Presentation**: WebSocket Broadcast -> React/Vite Dashboard & Expo Mobile App -> UI state update.

**Architecture Explanation:**
The system utilizes a modern, decoupled client-server architecture:
*   **Backend (Python/FastAPI)**: Handles API routing, WebSocket management, ML inference, and DB transactions. Selected for its asynchronous capabilities (high concurrency) and native compatibility with Python-based ML libraries.
*   **Database (MongoDB)**: NoSQL document store selected for its flexibility in handling unstructured network log data and varying threat telemetry formats.
*   **Web Frontend (React/Vite)**: Component-driven UI using Radix primitives and Tailwind CSS.
*   **Mobile Frontend (React Native/Expo)**: Cross-platform mobile monitoring application.

---

## 2. MACHINE LEARNING IMPLEMENTATION

**Exact Preprocessing Pipeline:**
The pipeline processes the CICIDS2017 dataset. Because raw network captures contain anomalies (e.g., division by zero resulting in infinite values), the system explicitly replaces `np.inf` and `-np.inf` with `NaN`, and subsequently fills all missing values with `0.0` (`X_train.replace([np.inf, -np.inf], np.nan).fillna(0)`).

**Dataset Balancing & Sampling:**
Due to the sheer volume of the CICIDS2017 dataset, training on the entirety of the data in a localized academic environment caused memory faults. A stratified random sampling technique was implemented (defaulting to 50,000 training rows and 10,000 testing rows), utilizing `np.random.RandomState`.

**Model Implementation Details:**
The system supports multiple algorithms dynamically loadable via a registry map:
*   **Random Forest (Primary)**: Instantiated via `RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)`. Selected as the default due to its robust handling of high-dimensional tabular data, inherent resistance to overfitting, and easily interpretable `feature_importances_`.
*   **Gradient Boosting**: `GradientBoostingClassifier(n_estimators=100, max_depth=5)`.
*   *(Other implemented models: Decision Tree, KNN, Linear SVM, Extra Trees)*.

**Why Random Forest Was Selected Finally:**
While deep learning (like LSTM) is excellent for sequential data, Random Forest provided the optimal balance of inference speed (milliseconds per prediction), which is critical for real-time IDS, and explainability. It allows the system to extract and display "Top 10 Feature Importances" to the security analyst on the dashboard.

**Evaluation & Metrics:**
Evaluation occurs post-training using a hold-out test set. The system calculates:
*   **Accuracy** (`accuracy_score`)
*   **Precision** (`precision_score` with `zero_division=0`)
*   **Recall** (`recall_score`)
*   **F1-Score** (`f1_score`) - Crucial due to the inherently imbalanced nature of network traffic (benign heavily outweighs malicious).
*   **Confusion Matrix**: Used to calculate isolated Per-Class Accuracy (Normal Traffic vs. Attack Traffic), identifying the exact False Positive Rate.

**Model Serialization & Inference:**
Models are serialized using `joblib` (`joblib.dump`) and saved to the `/models` directory with a unique timestamp signature. The backend maintains an "Active" status flag in MongoDB. On inference, the `predictor.py` script loads the active `.pkl` file into a hot-cache to prevent disk I/O bottlenecks during live traffic analysis.

**Online Learning Workflow:**
The system implements a novel feedback loop: live captured traffic that is confidently classified is saved to a `captured_traffic` collection. During retraining, this "pseudo-labelled" data is merged back into the baseline CSV data, allowing the model to adapt to environmental network shifts dynamically.

---

## 3. DATASETS

**CICIDS2017 Usage:**
The primary foundation for the ML model is the Canadian Institute for Cybersecurity IDS 2017 dataset. It contains benign and the most up-to-date common attacks, closely resembling true real-world data (PCAPs).
*   **Feature Engineering Performed**: Flow-based features generated via tools like CICFlowMeter (or Scapy in the live system) including Flow Duration, Total Fwd/Bwd Packets, Packet Length stats, etc.
*   **Limitations**: The dataset is static. While comprehensive for 2017, novel zero-day attacks or newly discovered CVEs are not inherently present. The "Online Learning" module in DefenXion was designed specifically to mitigate this limitation.

---

## 4. BACKEND IMPLEMENTATION

**FastAPI Architecture & Structure:**
The backend uses a modular monolithic structure.
*   `/backend/main.py`: Entry point, Middleware definitions, WebSockets, core ML endpoints.
*   `/backend/auth/router.py`: JWT, Login, 2FA logic.
*   `/backend/database.py`: MongoDB connection management.
*   `/backend/defenxion_response_engine.py`: Business logic for handling threat responses.

**Authentication Workflow:**
1.  **Login**: User posts credentials via `OAuth2PasswordRequestForm`.
2.  **Validation**: Rate-limiting checked -> Account Lockout checked -> Password verified via Bcrypt.
3.  **2FA Check**: If TOTP is enabled, a short-lived `temp_token` is issued requiring a second `/login/2fa` POST with the PyOTP code.
4.  **Token Issuance**: `access_token` (JWT, 30 min expiry) and `refresh_token` (stored in DB) generated.

**Security Middleware & RBAC:**
Role-Based Access Control is enforced via dependency injection (`Depends(require_admin)`). If a non-admin attempts to access logs or settings, a `403 Forbidden` is thrown.
Token blacklisting is implemented via a `token_blacklist` MongoDB collection to handle immediate session termination on logout.

---

## 5. DATABASE DESIGN

**MongoDB Architecture:**
A schema-less NoSQL approach was chosen.
*   **`users`**: Stores username, hashed_password, role, failed_attempts, lock_until, 2FA secrets.
*   **`detections`**: Stores parsed threat events (source IP, dest IP, confidence, action taken, explanations).
*   **`logs` & `alerts`**: Audit trails and stateful alerts (Status: ACTIVE/RESOLVED).
*   **`refresh_tokens`**: Stateful session management tracking device info and IP.
*   **`app_settings`**: Global configuration (sensitivity, email SMTP details, whitelist IPs).

**Indexing Strategy:**
Indexes are explicitly created on application startup in `database.py` to ensure O(1) or O(log N) query performance:
*   `detections.create_index([("timestamp", DESCENDING)])`
*   `detections.create_index([("source_ip", ASCENDING)])`
*   Compound Index: `logs.create_index([("event_type", ASCENDING), ("source_ip", ASCENDING)])` for lightning-fast aggregation of repeat offender IPs by the response engine.

---

## 6. FRONTEND IMPLEMENTATION

**React Architecture (Web):**
Built using Vite for rapid HMR and optimized build times.
*   **State Management**: Complex global state managed via React Context (`ThemeContext`, `AnalyticsContext`), while localized UI state uses `useState`/`useReducer`.
*   **Protected Routes**: Conditional rendering in `App.tsx` checks for `localStorage.getItem("access_token")`. If absent, forces rendering of the `Login` component.
*   **UI/UX**: Utilizes `Radix UI` primitives for accessible, unstyled interactive components, styled with `Tailwind CSS`.
*   **Visualizations**: `Recharts` library used for line charts, bar charts, and radar charts on the Analytics and AI Model pages. `react-force-graph-2d` utilized for interactive network topology mapping.

**Mobile Implementation (React Native/Expo):**
A companion mobile app utilizes Expo Router for file-based navigation (`app/(tabs)`). It consumes the same REST API as the web dashboard, sharing JWT logic but rendering via native components (`react-native-svg`, `react-native-chart-kit`).

---

## 7. AUTOMATED RESPONSE ENGINE

**Logic & Workflow (`defenxion_response_engine.py`):**
The response engine acts as the "brain" determining the repercussion of a threat.
1.  **Risk Scoring**: Extracts dynamic `sensitivity` (0-100) from the DB. Calculates `conf_high` and `conf_med` thresholds dynamically based on this sensitivity.
2.  **Attack History Tracking**: Checks MongoDB via an in-memory cached lookup (`_attack_counter_cache`) to see how many times the `source_ip` has offended.
3.  **Action Matrix**:
    *   `Confidence >= conf_high` AND `Repeat Offender (count >= 3)` -> `CRITICAL_BLOCK`
    *   `Confidence >= conf_high` -> `BLOCK_IP`
    *   `Confidence >= conf_med` -> `ALERT_ADMIN`
    *   Else -> `LOG_ONLY`

**Why Real Blocking Was Simulated:**
True network-level blocking requires manipulating routing tables, iptables, or proprietary firewall APIs (e.g., Palo Alto). For the academic scope, the system executes an OS-level Windows firewall block using `subprocess.run('netsh advfirewall firewall add rule...', shell=True)`. This perfectly *simulates* the logical trigger while remaining isolated to the host machine for safety and ethical boundaries. Real Email and Slack webhooks are successfully integrated for external notifications.

---

## 8. SECURITY IMPLEMENTATION

The platform itself is hardened following OWASP principles:
*   **Authentication**: Passwords hashed using `bcrypt`. JWT tokens signed with `HS256` utilizing a `.env` stored `SECRET_KEY`.
*   **Brute Force Prevention**: A server-side rate limiter allows max 10 attempts per 60 seconds per IP.
*   **Account Locking**: 5 consecutive failed logins result in a 15-minute hard account lock (`lock_until` DB field).
*   **Session Management**: Refresh tokens are stored server-side. Revoking a session immediately invalidates the refresh token. Blacklisting invalidates active JWTs.
*   **IP Whitelisting**: Custom middleware (`ip_whitelist_middleware`) intercepts requests and rejects unauthorized IPs if the global security toggle is active.
*   **Multi-Factor Authentication**: Implemented Time-Based One-Time Passwords (TOTP) utilizing the `pyotp` library and `qrcode.react` for provisioning.

---

## 9. TESTING & EVALUATION

*   **API Testing**: All endpoints rigorously tested via FastAPI's interactive Swagger UI (`/docs`).
*   **ML Evaluation**: F1-scores and confusion matrices analyzed to tune `max_depth` and `n_estimators`.
*   **False-Positive Mitigation**: The dynamic sensitivity threshold and the "repeat offender" logic were specifically designed to prevent false positives from accidentally blocking legitimate traffic. An IP must cross high confidence thresholds *multiple* times to escalate from an Alert to a Critical Block.
*   **Performance**: Websocket broadcast testing confirmed sub-100ms latency from ML inference completion to UI dashboard update.

---

## 10. IMPLEMENTATION CHALLENGES

*   **Challenge 1 - Memory Limitations with Pandas**: Loading the multi-gigabyte CICIDS2017 dataset crashed Python.
    *   **Solution**: Implemented dynamic stratified sampling (reading via chunks/subsets) to train accurate models within hardware constraints.
*   **Challenge 2 - Real-Time Dashboard Sync**: Traditional HTTP polling resulted in high server load and delayed UI updates.
    *   **Solution**: Migrated threat alerts to FastAPI `WebSocket` connections (`ConnectionManager`), allowing instant push notifications to the React frontend.
*   **Challenge 3 - Mobile/Web Code Sharing**: Maintaining two separate UI codebases.
    *   **Solution**: Ensured the FastAPI backend was strictly decoupled and stateless (aside from DB), acting as a unified monolithic service for both the Vite Web Dashboard and the Expo Mobile application.
*   **Challenge 4 - Handling Large PCAPs**: PCAP parsing is heavily CPU-bound.
    *   **Solution**: Implemented a hard 50MB file upload limit (`UploadFile`) and extracted flow features rather than full payload inspection.

---

## 11. DEVELOPMENT PROCESS

1.  **Phase 1: Backend & Data Foundation**: Established MongoDB schemas, FastAPI structure, and basic JWT auth.
2.  **Phase 2: ML Pipeline Setup**: Integrated Scikit-learn, processed the CICIDS2017 data, and wrote the training/inference modules.
3.  **Phase 3: Automated Response**: Built the rule engine, integrating Windows firewall simulation and SMTP email dispatch.
4.  **Phase 4: Web Dashboard Creation**: Developed the React frontend, wired up charts, websockets, and dark/light theming.
5.  **Phase 5: Mobile App & Refinement**: Ported core functionality to React Native Expo, refined UI/UX, and implemented 2FA and Security Copilot concepts.

---

## 12. DEPLOYMENT & ENVIRONMENT

*   **Backend Dependencies**: `fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `pymongo`, `python-jose`, `passlib`, `pyotp`, `scapy`.
*   **Frontend Dependencies**: `react`, `vite`, `radix-ui`, `recharts`, `tailwindcss`.
*   **Mobile Dependencies**: `expo`, `react-native`, `react-navigation`.
*   **Configuration**: Environment variables (`.env`) strictly manage `MONGODB_URI`, `SECRET_KEY`, and `ALGORITHM`.
*   **Running State**: Currently runs locally via batch scripts (`start.bat` / `uvicorn backend.main:app`). For production, this architecture is container-ready (Docker/Docker-Compose).

---

## 13. LIMITATIONS & FUTURE IMPROVEMENTS

*   **Current Limitations**:
    *   OS-dependent blocking (Windows `netsh`).
    *   Scapy packet parsing is slow in pure Python for multi-gigabit line speeds.
*   **Future Enhancements**:
    *   Porting the Deep Packet Inspection (DPI) engine from Python/Scapy to a high-performance C/Rust backend or eBPF.
    *   API Integrations with actual edge hardware (e.g., pfSense, Cisco ASA, AWS WAF).
    *   Implementing Deep Learning (LSTM/Transformers) for temporal sequence analysis of packets rather than just flow-level statistical features.

---

## 14. SCREENSHOTS/DIAGRAMS TO INCLUDE IN REPORT (Suggestions)

1.  **Architecture Diagram**: Show the decoupled nature (Network -> FastAPI -> MongoDB -> React/Expo).
2.  **Authentication Flow Diagram**: UML Sequence diagram of the Login -> 2FA -> JWT Issuance -> Refresh Token cycle.
3.  **ML Workflow Diagram**: Feature Extraction -> Null Replacement -> Random Forest Inference -> Confidence Scoring.
4.  **UI Screenshots**:
    *   The "Live Analytics" dashboard showing Recharts graphs.
    *   The "AI Model" registry showing active/inactive models and Top 10 Features.
    *   The Mobile App "Threat Alerts" screen.
5.  **Evaluation Charts**: Include the Confusion Matrix or a Bar Chart of F1-Scores across different algorithms.

---

## 15. REFERENCES & RESEARCH BASIS

*   **Datasets**: Sharafaldin, I., Lashkari, A. H., & Ghorbani, A. A. (2018). *Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization*. (CICIDS2017).
*   **Frameworks**:
    *   FastAPI Documentation: https://fastapi.tiangolo.com/
    *   Scikit-Learn Documentation: https://scikit-learn.org/
    *   React & Vite Documentation.
*   **Security Standards**: OWASP Top 10 (Mitigation strategies implemented for Broken Authentication, Security Misconfiguration via JWT and Rate Limiting).
*   **Concepts**: Machine Learning for Network Anomaly Detection, Zero Trust Architecture, Role-Based Access Control (RBAC).
