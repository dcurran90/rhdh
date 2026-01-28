#!/bin/bash
set -e

# Deploy RHDH with Vault plugins to OpenShift
# Usage: ./deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFESTS_DIR="${SCRIPT_DIR}/../manifests"

NAMESPACE="rhdh-vault-test"
VAULT_NAMESPACE="vault-testing"

echo "================================================"
echo "Deploying RHDH with Vault Plugins to OpenShift"
echo "================================================"

# Check if logged into OpenShift
if ! oc whoami &> /dev/null; then
  echo "ERROR: Not logged into OpenShift cluster"
  echo "Please run: oc login"
  exit 1
fi

echo "Logged in as: $(oc whoami)"
echo "Current cluster: $(oc cluster-info | head -n1)"
echo ""

# Ask for confirmation
read -p "Deploy to this cluster? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 0
fi

# Deploy Vault (optional)
echo ""
read -p "Deploy Vault dev server? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Creating Vault namespace..."
  oc apply -f "${SCRIPT_DIR}/../vault/vault-deployment.yaml"

  echo "Waiting for Vault to be ready..."
  oc wait --for=condition=ready pod -l app=vault -n ${VAULT_NAMESPACE} --timeout=300s

  VAULT_ROUTE=$(oc get route vault -n ${VAULT_NAMESPACE} -o jsonpath='{.spec.host}')
  echo "Vault deployed at: https://${VAULT_ROUTE}"
  echo "Vault Token: root"

  VAULT_ADDR="http://vault.${VAULT_NAMESPACE}.svc.cluster.local:8200"
else
  read -p "Enter Vault Address: " VAULT_ADDR
fi

# Create RHDH namespace
echo ""
echo "Creating RHDH namespace..."
oc new-project ${NAMESPACE} || oc project ${NAMESPACE}

# Create secrets
echo ""
echo "Creating secrets..."

read -p "Vault Token [root]: " VAULT_TOKEN
VAULT_TOKEN=${VAULT_TOKEN:-root}

oc create secret generic rhdh-vault-secrets \
  --from-literal=VAULT_ADDR="${VAULT_ADDR}" \
  --from-literal=VAULT_TOKEN="${VAULT_TOKEN}" \
  --dry-run=client -o yaml | oc apply -f -

read -p "GitHub Token (optional, press Enter to skip): " GITHUB_TOKEN
if [ -n "${GITHUB_TOKEN}" ]; then
  oc create secret generic rhdh-github-secrets \
    --from-literal=GITHUB_TOKEN="${GITHUB_TOKEN}" \
    --dry-run=client -o yaml | oc apply -f -
else
  # Create empty secret
  oc create secret generic rhdh-github-secrets \
    --from-literal=GITHUB_TOKEN="" \
    --dry-run=client -o yaml | oc apply -f -
fi

# Deploy ConfigMaps
echo ""
echo "Deploying ConfigMaps..."
oc apply -f "${MANIFESTS_DIR}/configmap-app-config.yaml"
oc apply -f "${MANIFESTS_DIR}/configmap-dynamic-plugins.yaml"

# Check if RHDH operator is installed
echo ""
echo "Checking for RHDH operator..."
if ! oc get csv -n rhdh-operator 2>/dev/null | grep -q rhdh; then
  echo "RHDH operator not found. Installing..."
  oc apply -f "${MANIFESTS_DIR}/operator-subscription.yaml"

  echo "Waiting for operator to be ready (this may take a few minutes)..."
  sleep 30
  oc wait --for=condition=ready pod -l name=rhdh-operator -n rhdh-operator --timeout=600s || true
else
  echo "RHDH operator already installed"
fi

# Deploy RHDH instance
echo ""
echo "Deploying RHDH instance..."
echo "IMPORTANT: Make sure you've updated the image in ${MANIFESTS_DIR}/rhdh-instance.yaml"
read -p "Press Enter to continue..."

oc apply -f "${MANIFESTS_DIR}/rhdh-instance.yaml"

echo ""
echo "Waiting for RHDH to be ready (this may take several minutes)..."
oc wait --for=condition=ready backstage rhdh-vault-test -n ${NAMESPACE} --timeout=600s || true

# Get the route
RHDH_ROUTE=$(oc get route rhdh-vault-test -n ${NAMESPACE} -o jsonpath='{.spec.host}' 2>/dev/null || echo "Route not found yet")

echo ""
echo "================================================"
echo "Deployment Complete!"
echo "================================================"
echo "RHDH URL: https://${RHDH_ROUTE}"
echo ""
echo "To check status:"
echo "  oc get backstage rhdh-vault-test -n ${NAMESPACE}"
echo "  oc get pods -n ${NAMESPACE}"
echo ""
echo "To view logs:"
echo "  oc logs -l app=backstage -c backstage -n ${NAMESPACE} -f"
echo "================================================"
