# 🚀 Optimized User Listing & Bulk Ingestion System

A high-performance, enterprise-grade Node.js service engineered for high-throughput user ingestion and optimized cursor-based listing. By leveraging asynchronous background queues, dual-layer Redis implementations, and cursor-based pagination, this project handles massive CSV uploads and fast data retrieval without blocking the main event loop.

---

## 🏗️ Architecture Design

The system employs a decoupled, event-driven architecture designed to optimize CPU-heavy operations (like CSV parsing and database writes) and cache-heavy operations (like paginated reads).

```mermaid
graph TD
    Client[Client Browser / API Client]
    
    subgraph Express HTTP Layer
        Express[Express App :3000]
        Multer[Multer Memory Storage]
        Parser[csv-parser Engine]
    end
    
    subgraph Caching & Queuing (Redis)
        RedisCache[(Redis Cache Client)]
        BullQueue[(BullMQ mainQueue)]
    end
    
    subgraph Background Processing
        Worker[BullMQ mainWorker]
    end
    
    subgraph Persistent Storage
        Prisma[Prisma Client / Adapter]
        MySQL[(MySQL / MariaDB)]
    end

    %% Flow lines
    Client -->|POST /user CSV Upload| Express
    Express --> Multer --> Parser
    Parser -->|Asynchronous Queue Job| BullQueue
    Express -.->|Invalidate 'user:*' cache| RedisCache
    
    Client -->|GET /user?limit=N&offset=C| Express
    Express -->|1. Check Cache| RedisCache
    RedisCache -->|Cache Hit: Return Data| Client
    
    Express -->|2. Cache Miss: Query Database| Prisma
    Prisma --> MySQL
    MySQL -->|Return Records| Express
    Express -->|3. Write to Cache| RedisCache
    
    Worker -->|Process 'create_user' Job| BullQueue
    Worker -->|Prisma: createMany| MySQL
```

---

## ⚡ Key Highlights & Engineering Features

*   **Non-Blocking Bulk Uploads**: Uploading massive CSV files is a heavy I/O and processing operation. Instead of blocking the Express server thread, files are parsed dynamically in memory and offloaded immediately to **BullMQ** running on Redis. The server returns a fast `200 OK` response with the queue job details.
*   **Decoupled Worker Architecture**: A dedicated background worker (`mainWorker.ts`) listens to the `mainQueue` and performs efficient batch database insertions using Prisma's `createMany`.
*   **Dual-Purpose Redis Integration**:
    *   **`ioredis` + BullMQ**: Powers the robust background queue with auto-retries, connection management, and crash resilience.
    *   **`node-redis`**: Serves as a high-speed database cache layer for paginated reads, featuring auto-invalidation and custom cache keys.
*   **Cursor-Based Pagination**: Unlike traditional offset-based pagination (`LIMIT 10 OFFSET 100000`) which degrades in performance as the dataset grows, this system implements highly efficient **cursor-based pagination** (leveraging indexed IDs) to maintain $O(1)$ query times even with millions of rows.
*   **MariaDB/MySQL Native Adapter**: Uses Prisma's native MariaDB adapter (`@prisma/adapter-mariadb`) to establish highly efficient connection pooling (`connectionLimit: 5`) and database bindings.

---

## 🛠️ Technical Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Language** | Node.js (v18+), TypeScript, `ts-node`, `tsx` | Robust type safety, modern syntax, fast execution. |
| **API Framework** | Express (v5.x) | Lightweight routing, HTTP server capabilities. |
| **OR/M Database** | Prisma Client, MySQL/MariaDB | Schema safety, migrations, native connection pooling. |
| **Queuing Engine** | BullMQ, `ioredis` | Enterprise background queuing, task retries, robust event listener. |
| **Cache Layer** | Redis (`node-redis`) | Dynamic HTTP response caching with automatic TTL (60s). |
| **File Processing** | Multer, `csv-parser` | In-memory multipart file handling, stream-based CSV processing. |

---

## 📁 Repository Structure

```
optimized-list/
├── prisma/
│   ├── migrations/              # SQL Migration history files
│   ├── schema.prisma            # Prisma schema models (User & Post)
│   └── migration_lock.toml
├── src/
│   ├── config/
│   │   └── ioRedis.ts           # ioredis connection config for BullMQ
│   ├── generated/
│   │   └── prisma/              # Auto-generated Prisma client classes
│   ├── lib/
│   │   ├── csvParser.ts         # Stream-based CSV buffer parser
│   │   ├── mainQueue.ts         # BullMQ queue instantiator
│   │   ├── multer.ts            # Memory-based Multer file filter (.csv limits)
│   │   ├── prisma.ts            # Prisma client instance with MariaDB adapter
│   │   └── redisServer.ts       # node-redis cache connection & methods
│   ├── workers/
│   │   └── mainWorker.ts        # BullMQ queue consumer for bulk insertion
│   └── main.ts                  # Main Express API entrypoint
├── .env                         # Environment variables configuration
├── prisma.config.ts             # Prisma environment config loader
├── tsconfig.json                # TypeScript compiler parameters
└── package.json                 # Project dependencies & scripts
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory of the project. A template config is provided below:

```ini
# Server Port Configuration
PORT=3000

# Prisma Direct Database Connection String
DATABASE_URL="mysql://root:root@localhost:3306/mydb"

# MariaDB Adapter Connection Credentials
DATABASE_HOST="localhost"
DATABASE_PORT=3306
DATABASE_USER="root"
DATABASE_PASSWORD="root"
DATABASE_NAME="mydb"

# Redis Server URL
REDIS_URL="redis://localhost:6379"
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Redis Server](https://redis.io/) (running locally or remotely on port `6379`)
*   [MySQL / MariaDB Database](https://mariadb.org/) (running locally or remotely on port `3306`)

---

### 📦 Installation Steps

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Sourav-Chakraborty/user-cursor-listing.git
    cd optimized-list
    ```

2.  **Install Project Dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Database & Migrations**:
    Ensure MySQL/MariaDB is running and that the database specified in `.env` (`mydb`) exists. Then, run the migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
    This will apply the SQL migrations to the database and generate the Prisma Client under `src/generated/prisma`.

---

### 🖥️ Running the Application

This system consists of two processes: the **API Server** and the **Background Queue Worker**. Both must be running concurrently for full functionality.

#### 1. Start the API Server (Development Mode)
This process hosts the Express HTTP routes and handles incoming traffic:
```bash
npm run dev
```
*Expected Output:*
```
Server is running on port 3000
Redis Connected
```

#### 2. Start the BullMQ Background Worker
Open a new terminal window and launch the worker to consume and process CSV upload tasks:
```bash
npm run worker
```
*Expected Output:*
```
Worker started successfully (waiting for jobs...)
```

---

## 🔌 API Documentation & Usage Reference

### 1. Ingest Users (Bulk CSV Upload)
Uploads a `.csv` file containing user records. The server parses the file, schedules a database batch-insert in the background, invalidates current query caches, and immediately returns the scheduled task details.

*   **Endpoint**: `POST /user`
*   **Content-Type**: `multipart/form-data`
*   **Request Body**:
    *   `file`: The CSV file (key must be named `file`)

#### 📝 CSV Template Structure
Your uploaded CSV file should contain `email` and `name` headers. For example:
```csv
email,name
alice.doe@example.com,Alice Doe
bob.smith@example.com,Bob Smith
charlie.brown@example.com,Charlie Brown
```

#### 📥 Example Request (cURL)
```bash
curl -X POST -F "file=@/path/to/users.csv" http://localhost:3000/user
```

#### 📤 Example Response JSON
```json
{
  "message": "Successfullly parsed",
  "data": {
    "name": "create_user",
    "data": {
      "data": [
        { "email": "alice.doe@example.com", "name": "Alice Doe" },
        { "email": "bob.smith@example.com", "name": "Bob Smith" }
      ]
    },
    "opts": {
      "attempts": 1,
      "delay": 0,
      "timestamp": 1716301200000
    },
    "id": "1",
    "queueName": "mainQueue"
  }
}
```

---

### 2. Fetch Users (Cached Cursor-Based Paginated List)
Fetches users from the database using high-performance cursor pagination and caching.

*   **Endpoint**: `GET /user`
*   **Query Parameters**:
    *   `limit` *(required, integer)*: Number of items to retrieve (e.g., `10`).
    *   `offset` *(optional, integer, default: `1`)*: The ID of the User serving as the cursor pivot.
    *   `searchText` *(optional, string)*: Filters results where `name` or `email` contains the provided string.

#### 📥 Example Request (cURL)
To fetch the first `10` users starting at User ID `1`:
```bash
curl "http://localhost:3000/user?limit=10&offset=1"
```

To fetch the next page starting at User ID `11`:
```bash
curl "http://localhost:3000/user?limit=10&offset=11"
```

To fetch users filtered by search term `"Alice"`:
```bash
curl "http://localhost:3000/user?limit=5&offset=1&searchText=Alice"
```

#### 📤 Example Response JSON
```json
{
  "message": "User fetched again",
  "data": [
    {
      "id": 1,
      "email": "alice.doe@example.com",
      "name": "Alice Doe",
      "posts": []
    },
    {
      "id": 2,
      "email": "bob.smith@example.com",
      "name": "Bob Smith",
      "posts": []
    }
  ]
}
```

> [!NOTE]
> The first request to a specific query returns `"message": "User fetched again"` indicating a cache miss. Subsequent requests within the next **60 seconds** will return `"message": "User fetched"` indicating a sub-millisecond cache hit directly from Redis!

---

## 📈 System Optimizations

### 📚 Offset vs Cursor Pagination Performance
Traditional offset-based pagination (`OFFSET 500000 LIMIT 10`) forces the database engine to scan and discard 500,000 records before returning the final 10. This leads to severe database performance degradation as table sizes increase.
In contrast, cursor-based pagination queries are mapped as:
```sql
SELECT * FROM User WHERE id >= :cursor_id ORDER BY id ASC LIMIT :limit
```
Because `id` is a primary key index, the database jumps directly to the cursor row instantly, ensuring constant-time ($O(1)$) operations.

### 🗄️ Background Worker Ingestion
Performing heavy I/O operations directly inside Express request-response handlers leads to request timeouts and severely degrades overall throughput. By delegating the execution queue to BullMQ, the Express thread is freed up instantly. BullMQ guarantees task execution, automatically handles process failures, and manages job backpressure smoothly.

---

## 🤝 Contributing & License
Contributions, issues, and feature requests are welcome! Under the **ISC License**.
