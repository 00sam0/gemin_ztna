# Dockerfile

# --- Stage 1: Build React Frontend ---
# Use a Node.js image to build the static files for the React app
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app/frontend

# Copy package.json and package-lock.json (or yarn.lock)
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# --- FIX: Add execute permissions to the vite command ---
RUN chmod +x /app/frontend/node_modules/.bin/vite

# Copy the rest of the frontend source code
COPY frontend/ ./

# Build the React app for production
RUN npm run build


# --- Stage 2: Build and run FastAPI Backend ---
# Use an official Python image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install dependencies for the backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into the container
COPY ./backend /app/backend

# Copy the built frontend static files from the 'build' stage
# The output of `vite build` is in the `dist` folder
COPY --from=build /app/frontend/dist ./backend/static

# Expose the port the app runs on
EXPOSE 8000

# Command to run the Uvicorn server
# The --host 0.0.0.0 is crucial for it to be accessible from outside the container
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
