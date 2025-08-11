FROM golang:1.24.5-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o backend ./backend/main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/backend .

EXPOSE 12345
RUN ls -l /app
CMD ["./backend"]