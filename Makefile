# Load .env file if available (.env should contain KEY=VALUE pairs)
-include .env

# Retrieve DOCKER_USERNAME from the environment (error out if not set)
ifndef DOCKER_USERNAME
$(error DOCKER_USERNAME is not set. Please set it in your environment or in a .env file)
endif

# Docker related variables
IMAGE_NAME = autonome-coinbase-agentkit-integration
TAG ?= latest

# Full image name with tag
DOCKER_IMAGE = $(DOCKER_USERNAME)/$(IMAGE_NAME):$(TAG)

.PHONY: build
build:
	docker build --platform linux/amd64 -t $(DOCKER_IMAGE) .

.PHONY: push
push:
	@if ! docker images | grep -q $(DOCKER_IMAGE); then \
		$(MAKE) build; \
	fi
	docker push $(DOCKER_IMAGE)

.PHONY: all
all: build push

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build    - Build the Docker image (targeting linux/amd64)"
	@echo "  make push     - Push the image to DockerHub (build automatically if image is not found)"
	@echo "  make all      - Build and push the image"
	@echo ""
	@echo "Environment variable settings:"
	@echo "  DOCKER_USERNAME    - Your DockerHub username (do not hardcode sensitive information)"
	@echo "  TAG                - Image tag (default: latest)"
