BINARY  := app
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo dev)
COMMIT  := $(shell git rev-parse --short HEAD 2>/dev/null || echo none)
DATE    := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
LDFLAGS := -s -w -X github.com/tsdlanm/app/cmd.version=$(VERSION) \
           -X github.com/tsdlanm/app/cmd.commit=$(COMMIT) \
           -X github.com/tsdlanm/app/cmd.date=$(DATE)

.PHONY: build run test fmt vet clean

build:
	go build -ldflags "$(LDFLAGS)" -o bin/$(BINARY) .

run:
	go run . $(ARGS)

test:
	go test ./...

fmt:
	gofmt -w .

vet:
	go vet ./...

clean:
	rm -rf bin
