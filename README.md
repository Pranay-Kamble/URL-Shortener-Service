# URL Shortener: An Exploration in System Design

A minimalist, high-performance backend service built to explore the challenges of unique ID generation, caching strategies, and cloud infrastructure synchronization.

**Live API Documentation:** [https://url-shortener.pranaykamble.me/docs](https://url-shortener.pranaykamble.me/docs)


##  Learning Objectives

The goal of this project was to move beyond basic CRUD operations and implement the core components of a scalable backend system:

* **Unique ID Generation:** Implementing a Base62 encoding system to provide shorter, user-friendly URLs.
* **Efficient Lookups:** Implementing a caching layer to reduce latency and database load for high-traffic "redirect" events.
* **Infrastructure as Code (IaC):** Managing a multi-service stack (Web, Worker, DB, Cache) using Render Blueprints for reproducible and consistent deployments.


##  Technical Stack

* **Language:** Python 3.11
* **Framework:** FastAPI (Asynchronous request handling)
* **Primary Database:** PostgreSQL (Persistence via SQLAlchemy & Asyncpg)
* **Caching Layer:** Redis (O(1) lookups for redirects)
* **DevOps:** Docker & Docker Compose
* **Cloud Hosting:** Render (Oregon Region)


##  Architecture & Decisions

### 1. ID Generation Logic
To generate unique short codes, I implemented a **Base62 Encoding** algorithm. 

* **The Logic:** By using `[0-9][a-z][A-Z]`, we get 62 characters to work with. A 7-character code provides over 3.5 trillion unique combinations.
* **Optimization:** Used a "Scrambler Prime" and "Secret" offset to ensure that generated IDs do not appear sequential, preventing users from guessing other shortened URLs.

### 2. The Caching Strategy
The service utilizes a **Read-Aside** caching pattern to optimize the most common operation: Redirection.

1.  When a redirect is requested, the service checks **Redis** first.
2.  If it is a "cache miss," it queries **PostgreSQL**.
3.  The result is then written back to Redis with a TTL (Time To Live) to maintain a slim memory footprint.

### 3. Background Sync Worker
Analytics and cleanup logic are separated into a standalone **Background Worker**.

* **Why?** This keeps the main API thread unblocked and highly responsive. The worker handles heavier asynchronous tasks without impacting the end-user's redirect speed.


##  Challenges & Solutions

### Asynchronous Database Drivers
* **Issue:** Initial implementation used synchronous drivers which bottlenecked the FastAPI event loop.
* **Solution:** Transitioned the entire persistence layer to `asyncpg`. This allowed the application to handle multiple concurrent database requests without blocking, significantly increasing throughput.

### Cloud Networking (VPC) & DNS
* **Issue:** Encountered `socket.gaierror` during deployment due to cross-region database lookups.
* **Solution:** Utilized Render Blueprints to enforce "Region Alignment" (Oregon). By placing the Web Service, Redis, and PostgreSQL in the same VPC, I was able to use internal connection strings for zero-latency private networking.


##  Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/url-shortener.git
    cd url-shortener
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the root directory. You can use the provided `.env.example` as a template.

3.  **Run with Docker:**
    ```bash
    docker-compose up --build
    ```

4.  **Access the API:**
    The interactive Swagger documentation will be available at `http://localhost:8000/docs`.


## 📈 Future Iterations

* **Rate Limiting:** Implementing Redis-based rate limiting to prevent API abuse and ensure service stability.
* **Frontend Dashboard:** Adding a management interface using React/Next.js to visualize URL analytics and click-through rates.
