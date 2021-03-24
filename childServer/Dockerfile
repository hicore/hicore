FROM golang:1.14-alpine AS build_base

RUN apk add --no-cache git
RUN apk add --no-cache bash

# Set the Current Working Directory inside the container
WORKDIR /app/child

# We want to populate the module cache based on the go.{mod,sum} files.
COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

# Build the Go app
RUN go build -o ./out/child .

COPY bash/wait-for-it.sh /usr/wait-for-it.sh
RUN chmod +x /usr/wait-for-it.sh

EXPOSE 7100/udp

# # Run the binary program produced by `go install`
# CMD ["./out/child"]
