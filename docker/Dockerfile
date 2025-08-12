# ---------- Builder stage ----------
FROM golang:1.24.5-alpine AS builder

WORKDIR /app

COPY ../go.mod ../go.sum ./

RUN go mod download

COPY ../ ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/project-backend ./backend/main.go

# ---------- Final stage ----------
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/project-backend ./project-backend
#get env
COPY backend/.env ./.env
 

# Expose the port
EXPOSE 12345

# Run
CMD ["./project-backend"]