# 1. Base Image: Lightweight Python
FROM python:3.11-slim

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy dependencies first (for faster re-builds)
COPY requirements.txt .

# 4. Install dependencies (no cache to keep image small)
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy ALL your code (main.py, db/, reset_db.py, etc.)
COPY . .

# 6. Default Command (We override this in docker-compose, but this is a good fallback)
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]