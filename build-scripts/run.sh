#!/bin/bash
set -e

TAR_FILE="production-planner-ui.tar" PORT="80" IMAGE_NAME="production-planner-ui" IMAGE_TAG="latest" ENV_FILE=".env"

if [ ! -f "$TAR_FILE" ]; then
  echo "❌ TAR file not found: $TAR_FILE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ENV file not found: $ENV_FILE"
  exit 1
fi

echo "=== Step 1: Loading Docker image ==="
docker load -i "$TAR_FILE"

echo "=== Step 2: Removing old container if exists ==="
docker rm -f ${IMAGE_NAME}-container 2>/dev/null || true

echo "=== Step 3: Running container ==="
docker run -d \
  --name ${IMAGE_NAME}-container \
  --env-file ${ENV_FILE} \
  -p ${PORT}:80 \
  ${IMAGE_NAME}:${IMAGE_TAG}

echo "=== DONE ==="
