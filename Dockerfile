# Dockerfile

# --- Stage 1: Build the React frontend ---
# This stage builds the static assets for the React application.
FROM node:18 as frontend-builder
WORKDIR /app

# Copy package.json AND package-lock.json
COPY frontend/package.json frontend/package-lock.json* ./

# Use npm install. It's more flexible than npm ci and will bypass the lockfile error.
RUN npm install

# Copy the rest of the frontend code
COPY frontend/ .

# Execute the vite build script directly with node to bypass permission issues
RUN node node_modules/vite/bin/vite.js build

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