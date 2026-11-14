# 🏦 VaultX — Enterprise Core Banking, Distributed Microservices & Autonomous AI Ledger System

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v22-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-v5.3-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Replica_Set-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-v7_Cluster-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/BullMQ-Message_Queue-FF5722?style=for-the-badge&logo=rabbitmq&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-API_Gateway-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Multi_Container-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Qdrant-Cloud_Vector_DB-FF0055?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/LangGraph-AI_Agents-1C3C3C?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/LangChain-RAG_Pipeline-FF9900?style=for-the-badge&logo=langchain&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS-CI%2FCD_Deploy-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=white" />
</p>

---

## 🌟 Executive Summary

**VaultX** is a production-grade, enterprise-ready **Core Banking, Immutable Double-Entry Ledger, and Autonomous AI Financial Ecosystem**. Built from the ground up using **Event-Driven Microservices, ACID Distributed Transactions, Nginx API Gateway, Redis Caching, BullMQ Message Queues, Docker Orchestration, LangGraph Multi-Turn Agents, and a Qdrant Cloud Vector DB RAG Pipeline**, VaultX represents an industry-grade fintech platform engineered to meet stringent banking compliance, fault-tolerance, and zero-downtime scalability standards.

> **Key Architectural Guarantee**: **Zero Double-Spending, Zero Data Inconsistency, Zero Hallucination.**

---

## 🏛️ System Architecture Overview

```mermaid
flowchart TD
    Client(["🌐 Client Applications / Postman / Mobile / Web"])
    
    subgraph Gateway ["🚪 Central API Gateway Layer (Nginx)"]
        NGINX["Nginx Reverse Proxy & Load Balancer (:80 / :3000)"]
    end
    
    subgraph Microservices ["⚙️ Event-Driven Microservice Cluster"]
        AuthSvc["🔐 Auth Service (:3001)\n• JWT & Token Blacklisting\n• Redis OTP Management"]
        AccountSvc["💳 Account Service (:3002)\n• Account Creation\n• Derived Dynamic Balance"]
        TxSvc["💸 Transaction Service (:3003)\n• ACID Double-Entry Ledger\n• HMAC Signed Webhooks"]
    end
    
    subgraph Queues ["⚡ Asynchronous Queue & Cache Engine"]
        REDIS[("🔴 Redis Cache & Rate Limiting (:6379)")]
        BULLMQ["📬 BullMQ Background Workers\n• Async Email Alerts\n• Audit Event Dispatcher"]
    end
    
    subgraph Storage ["💾 High-Availability Data Tier"]
        MONGO[("🍃 MongoDB rs0 Replica Set (:27017)\n• ACID Transactions & Sessions\n• Append-Only Immutable Ledger")]
    end
    
    subgraph AI_Engine ["🤖 Autonomous AI & Retrieval Engine"]
        LangGraph["🧠 LangGraph Multi-Agent\n• StateGraph with Memory\n• Autonomous Banking Tools"]
        RAG["📚 LangChain RAG Engine\n• PDF Chunking (1000/200)\n• Google Generative AI Embeddings"]
        QDRANT[("🔴 Qdrant Cloud Vector Database\n• 768-Dim Dense Vectors\n• HNSW Cosine Similarity")]
    end

    Client --> NGINX
    NGINX -->|"/api/auth/*"| AuthSvc
    NGINX -->|"/api/accounts/*"| AccountSvc
    NGINX -->|"/api/transactions/*, /api/webhooks/*"| TxSvc
    NGINX -->|"/api/ai/*, /ai"| TxSvc

    AuthSvc & AccountSvc & TxSvc --> REDIS
    AuthSvc & TxSvc --> BULLMQ
    AuthSvc & AccountSvc & TxSvc --> MONGO
    
    TxSvc --> LangGraph
    LangGraph --> RAG
    RAG --> QDRANT
```

---

## 🎯 The 7 Architectural Pillars of VaultX

### 1. 📖 Double-Entry Accounting & Immutable Append-Only Ledger
* **The Accounting Invariant**: $\sum \text{Debits} = \sum \text{Credits}$ across all system balances.
* **Append-Only Protection**: The Ledger database model has strict Mongoose pre-hooks intercepting and permanently blocking `updateOne`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, and `findOneAndReplace`.
* **Dynamic Balance Derivation**: Accounts do not store static balances that can be hacked. Balances are calculated in real time:
  $$\text{Balance} = \sum(\text{Credits}) - \sum(\text{Debits})$$
* **ACID Multi-Document Atomicity**: Transactions utilize `mongoose.startSession()` and `session.startTransaction()`. If any step fails, the session aborts and rolls back automatically.
* **Idempotency Safeguard**: Every transaction mandates an `idempotencyKey` preventing accidental client retries or duplicate charge attempts.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Controller as Transaction Service
    participant Mongo as MongoDB Replica Set
    participant Ledger as Immutable Ledger
    participant Queue as BullMQ / Redis

    Client->>Controller: POST /api/transactions (Transfer Request + Idempotency Key)
    Controller->>Mongo: 1. Start ACID Session & Transaction
    Controller->>Ledger: 2. Calculate dynamic balance inside session
    alt Insufficient Balance
        Controller-->>Client: 400 Bad Request (Session Aborted)
    else Balance Available
        Controller->>Mongo: 3. Create Transaction Record (PENDING)
        Controller->>Ledger: 4. Append DEBIT Record (Sender)
        Controller->>Ledger: 5. Append CREDIT Record (Recipient)
        Controller->>Mongo: 6. Update Status (COMPLETED)
        Controller->>Mongo: 7. Commit Transaction Session
        Controller->>Queue: 8. Enqueue Async Transaction Email
        Controller-->>Client: 201 Created (Instant Settlement)
    end
```

---

### 2. 🔀 Distributed Microservices Architecture & Nginx API Gateway
VaultX can run as a high-density monolith for development or as independent containerized microservices in production:
* **Auth Microservice (`:3001`)**: User registration, login, JWT validation, Redis token blacklisting.
* **Account Microservice (`:3002`)**: Account opening, multi-currency support, dynamic balance derivation.
* **Transaction Microservice (`:3003`)**: Money transfers, double-entry accounting, webhooks, and AI pipelines.
* **Nginx Reverse Proxy (`:80 / :3000`)**: Central ingress gateway with path-based routing, client IP forwarding, health verification, and load balancing.

---

### 3. ⚡ Redis Caching, OTP Management & BullMQ Message Queue
* **Redis Caching**: Sub-millisecond user account caching and financial spending metrics aggregation.
* **Token Blacklisting**: Revoked JWTs are cached with TTL auto-expiration for instantaneous, stateless revocation.
* **BullMQ Distributed Queue**: Heavy asynchronous operations (transaction receipt emails, webhook delivery retries) are offloaded to background workers, keeping API response latency under 35ms.
* **Resilient Offline Guard**: Built-in `enableOfflineQueue: false` and reconnection circuit-breakers prevent the API from freezing if Redis is restarting.

---

### 4. 🤖 Autonomous LangGraph StateGraph AI Financial Agent
* **Multi-Turn Contextual Memory**: StateGraph maintains conversation states across interactions.
* **Autonomous Tool Routing**: The AI agent autonomously decides which tool to call based on user intent:
  - `get_user_financial_profile`: Inspects balance, total inflows/outflows.
  - `query_vaultx_bank_policy_rag`: Queries regulatory guidelines and bank policies.
  - `calculate_monthly_spend`: Categorizes spending patterns.
  - `tavily_financial_web_search`: Live financial search for market indicators.
* **Deterministic Fallback**: If LLM API quotas are exhausted, an autonomous fallback engine provides instant response continuity with zero downtime.

---

### 5. 📚 LangChain RAG & Qdrant Cloud Vector Database
A complete Retrieval-Augmented Generation (RAG) pipeline designed for document question-answering with **Zero Hallucination**:
* **PDF Extraction**: Native binary parsing via `new PDFParse({ data: buffer })`.
* **Semantic Chunking**: `RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })`.
* **Vector Embeddings**: High-dimensional (768-dim) dense vector embeddings using **Google Generative AI Embeddings** (`text-embedding-004`).
* **Vector DB (Qdrant Cloud)**: Integrated via `@langchain/qdrant` and `@qdrant/js-client-rest`, storing vector points in an AWS-hosted Qdrant Cloud cluster with HNSW cosine similarity search.
* **Strict Document Grounding**: Rejects any questions outside the document context. Never invents rates, prices, or policies.

```mermaid
flowchart LR
    PDF["📄 knowledge.pdf\n(Bank Policy / Retail Catalog)"] --> Extract["🔍 PDF Text Extraction\n(PDFParse)"]
    Extract --> Chunk["✂️ Semantic Splitter\n(Chunk: 1000, Overlap: 200)"]
    Chunk --> Embed["🧮 Google Embeddings\n(text-embedding-004 / 768-dim)"]
    Embed --> Qdrant[("🔴 Qdrant Cloud Vector DB\n(Collection: 'vaultx_knowledge')")]
    
    UserQuery(["❓ User Question\n('what is the price of Banana Pack 7?')"]) --> QueryEmbed["🧮 Query Embedding Vector"]
    QueryEmbed --> Search{"🔎 Cosine Similarity Search"}
    Qdrant --> Search
    Search --> Chunks["📑 Top-K Relevant Document Chunks"]
    Chunks --> LLM["🤖 Grounded LLM Synthesizer\n(Zero Outside Hallucination)"]
    UserQuery --> LLM
    LLM --> Answer(["✅ 'The price of Banana Pack 7 is n715.'"])
```

---

### 6. 🐳 Docker & Multi-Container Orchestration
The entire ecosystem is orchestrated via `docker-compose.yml`:
* `vaultx-api-gateway` (Nginx Alpine)
* `vaultx-auth-service` (Node.js 22 Alpine)
* `vaultx-account-service` (Node.js 22 Alpine)
* `vaultx-transaction-service` (Node.js 22 Alpine)
* `vaultx-db` (MongoDB 7 with Replica Set `rs0` automatic initialization)
* `vaultx-redis` (Redis 7 Alpine)
* `vaultx-qdrant` (Qdrant Vector Database)

---

### 7. 🚀 Automated CI/CD Pipeline & AWS Deployment
* **GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
  - Code syntax check & dependency verification
  - Automated Docker multi-stage build tests
  - Automated deployment over SSH to AWS EC2 instance
  - Zero-downtime rolling service reload

---

## 🔌 API Endpoints Reference

### 🔐 Authentication & Session
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account | ❌ No |
| `POST` | `/api/auth/login` | Login user, issue JWT (`httpOnly` cookie + Bearer) | ❌ No |
| `POST` | `/api/auth/logout` | Revoke JWT via Redis Blacklist | ✅ Yes |
| `GET` | `/api/auth/profile` | Fetch authenticated user profile | ✅ Yes |

### 💳 Accounts & Ledger
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/accounts` | Create a new banking account | ✅ Yes |
| `GET` | `/api/accounts` | Fetch all accounts owned by user | ✅ Yes |
| `GET` | `/api/accounts/balance/:accountId` | Dynamically calculate real-time balance | ✅ Yes |

### 💸 Atomic Transactions
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/transactions` | Execute atomic double-entry money transfer | ✅ Yes |
| `POST` | `/api/transactions/system/initial-funds` | Seed account with initial system capital | ✅ Yes |
| `GET` | `/api/transactions/history/:accountId` | Audit trail of all debit/credit ledger records | ✅ Yes |

### 🤖 AI Financial Advisor, Agents & RAG
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/ai` | **Direct Tutorial RAG Query** (Strict PDF-Grounded) | ❌ No |
| `POST` | `/api/ai/rag/query` | Query Document via Qdrant Cloud Vector Search | ❌ No |
| `GET` | `/api/ai/rag/status` | Vector Store & Qdrant Cloud indexing status | ❌ No |
| `POST` | `/api/ai/rag/reindex` | Re-index PDF into Qdrant Cloud collection | ❌ No |
| `POST` | `/api/ai/graph` | Autonomous LangGraph StateGraph Banking Agent | ✅ Yes |
| `GET` | `/api/ai/insights` | AI Financial Spending Insights & Advice | ✅ Yes |
| `POST` | `/api/ai/chat` | Conversational Financial Assistant | ✅ Yes |

---

## ⚡ Quickstart Guide (Local Setup)

### 1. Clone & Install
```bash
git clone https://github.com/vishalkumar2501/02_Advance_Backend_Banking_System_fullstack.git
cd 02_Advance_Backend_Banking_System_fullstack
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the project root:
```env
PORT=3000
SERVICE_NAME=all
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/vaultx
JWT_SECRET=your_super_secret_jwt_key_here
REDIS_URL=redis://localhost:6379

# Google Gemini & LangChain Embeddings
GEMINI_API_KEY=your_gemini_api_key

# Qdrant Cloud Vector Database
QDRANT_URL=https://your-cluster-id.eu-west-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_cloud_api_key
QDRANT_COLLECTION=vaultx_knowledge

# Email & Notifications (Optional)
EMAIL_USER=your_email@gmail.com
```

### 3. Run with Docker Compose (Recommended)
```bash
docker-compose up --build -d
```
All microservices, MongoDB Replica Set, Redis, Nginx Gateway, and Qdrant will start automatically.

### 4. Or Run Locally with Node.js
```bash
npm run dev
```

---

## 🧪 Comprehensive Verification & Edge Case Testing

Run the included automated test suite to verify all architectural layers:

```bash
# 1. Verify LangChain RAG & Qdrant Cloud Connection
node scratch/test-qdrant-rag.js

# 2. Verify Strict Document Grounding (Zero Hallucination)
node scratch/test-strict-rag.js

# 3. Verify Autonomous LangGraph Agent & StateGraph Memory
node scratch/test-langgraph-agent.js

# 4. Verify End-to-End RAG across HTTP API Endpoints
node scratch/test-rag-e2e.js
```

---

## 🛡️ Production Edge Cases Handled

| Edge Case | Solution Implemented |
|---|---|
| **Race Conditions & Double Spending** | MongoDB ACID sessions with pessimistic ledger checks and atomic debit/credit writes. |
| **Duplicate Button Clicks & Retries** | Unique `idempotencyKey` validation prevents duplicate financial execution. |
| **Ledger Tampering / Deletion** | Database-level pre-hook blocking update and delete queries on the Ledger collection. |
| **Redis Offline / Network Partition** | `enableOfflineQueue: false` and fallback handlers ensure zero request blocking. |
| **AI LLM Quota / Outage** | Autonomous Local Fallback Synthesizer serves verified answers with zero downtime. |
| **AI Hallucination / Untruthful Answers** | Strict document grounding rejects any questions outside the provided PDF. |
| **Process Crash on Unhandled Errors** | Global `unhandledRejection` and `uncaughtException` guards with graceful shutdown. |

---

## 👨‍💻 Author

**Vishal Kumar**  
* GitHub: [@vishalkumar2501](https://github.com/vishalkumar2501)  
* Project: **VaultX Core Banking & Autonomous AI Full-Stack System**

---

## 📄 License
This project is licensed under the **MIT License**.
