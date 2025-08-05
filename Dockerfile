# Dockerfile

# --- Stage 1: Build React Frontend ---
# Use the full Node.js image to avoid permission issues
FROM node:18 AS build

# Set a dedicated working directory for the frontend build
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY frontend/package*.json ./

# Install dependencies using npm ci for a clean, reliable install
RUN npm ci

# Copy the rest of the frontend source code
COPY frontend/ ./

# Build the React app for production
RUN npm run build


# --- Stage 2: Build and run FastAPI Backend ---
# Use an official Python image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the backend requirements first
COPY backend/requirements.txt ./backend/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy the built frontend static files from the 'build' stage
# The output of `vite build` is in the `dist` folder of the build stage
COPY --from=build /app/dist ./backend/static

# Copy the backend code into the container
COPY ./backend /app/backend

# Set the final working directory to the backend folder
WORKDIR /app/backend

# Expose the port the app runs on
EXPOSE 8000

# Command to run the Uvicorn server
# This will now run from within the /app/backend directory
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
