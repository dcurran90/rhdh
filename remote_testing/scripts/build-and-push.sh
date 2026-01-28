#!/bin/bash
set -e

# Build and push RHDH image with vault plugins
# Usage: ./build-and-push.sh [REGISTRY_USER] [IMAGE_TAG]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

REGISTRY="${REGISTRY:-quay.io}"
REGISTRY_USER="${1:-${USER}}"
IMAGE_TAG="${2:-vaultPlugin}"

IMAGE_NAME="${REGISTRY}/${REGISTRY_USER}/rhdh:${IMAGE_TAG}"

echo "================================================"
echo "Building RHDH Image with Vault Plugins"
echo "================================================"
echo "Registry: ${REGISTRY}"
echo "User: ${REGISTRY_USER}"
echo "Tag: ${IMAGE_TAG}"
echo "Full Image: ${IMAGE_NAME}"
echo "================================================"

# Ensure we're on the right branch
cd "${REPO_ROOT}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "${CURRENT_BRANCH}" != "vaultPlugin" ]; then
  echo "WARNING: Not on vaultPlugin branch (currently on ${CURRENT_BRANCH})"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "WARNING: You have uncommitted changes"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Build the image
echo ""
echo "Building image..."
# Use the .rhdh Dockerfile for version 1.6+
docker build -f .rhdh/docker/Dockerfile -t "${IMAGE_NAME}" .

# Push the image
echo ""
echo "Pushing image..."
docker push "${IMAGE_NAME}"

echo ""
echo "================================================"
echo "Image built and pushed successfully!"
echo "================================================"
echo "Image: ${IMAGE_NAME}"
echo ""
echo "Next steps:"
echo "1. Update remote_testing/manifests/rhdh-instance.yaml with this image"
echo "2. Deploy to OpenShift: oc apply -f remote_testing/manifests/"
echo "================================================"
