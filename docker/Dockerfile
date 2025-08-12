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

ARG CLIENT_ID
ARG CLIENT_SECRET
ARG REDIRECT_URI

COPY --from=builder /app/project-backend ./project-backend

# GET INTO FROM .ENV
RUN echo "CLIENT_ID=$CLIENT_ID" > .env \
 && echo "CLIENT_SECRET=$CLIENT_SECRET" >> .env \
 && echo "REDIRECT_URI=$REDIRECT_URI" >> .env

COPY --from=builder /app/project-backend ./project-backend
 
# Expose the port
EXPOSE 12345

# Run
CMD ["./project-backend"]