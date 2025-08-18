# ---------- Go Builder stage ----------
FROM golang:1.24.5-alpine AS backend-builder

WORKDIR /app

COPY ../go.mod ../go.sum ./

RUN go mod download

COPY ../ ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/project-full ./backend/main.go

# ---------- Extension Builder stage ----------
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy extension sources
COPY ../frontend/package*.json ./

# Install and compile
RUN npm install --include=dev
COPY ../frontend ./
RUN npm run compile

# ---------- Final stage ----------
FROM debian:bullseye-slim

WORKDIR /app

ARG CLIENT_ID
ARG CLIENT_SECRET
ARG REDIRECT_URI

COPY --from=backend-builder /app/project-full ./project-full
COPY --from=frontend-builder /frontend/dist ./extension

# GET INTO FROM .ENV
RUN echo "CLIENT_ID=$CLIENT_ID" > .env \
 && echo "CLIENT_SECRET=$CLIENT_SECRET" >> .env \
 && echo "REDIRECT_URI=$REDIRECT_URI" >> .env

#COPY --from=backend-builder /app/project-full ./project-full
 
# Expose the port
EXPOSE 12345

# Run
CMD ["./project-full"]