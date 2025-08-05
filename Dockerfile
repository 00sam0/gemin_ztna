# Dockerfile

# --- Stage 1: Build the React frontend ---
# This stage builds the static assets for the React application.
FROM node:18 as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
# Use npm ci for a clean, reliable install in automated environments
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Stage 2: The final application image ---
# This stage builds the final Python image, copying in the built frontend.
FROM python:3.9-slim
WORKDIR /app

# Copy Python dependencies and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY backend/ .

# Copy the built frontend from the builder stage into a 'static' directory
COPY --from=frontend-builder /app/dist ./static

# Expose the port the app runs on
EXPOSE 8000

# Command to run the Uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]