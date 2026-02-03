#!/bin/bash

# Commands to patch BackendInitializer.cjs.js in the RHDH container

echo "Step 1: Copy patched file to container"
kubectl cp /Users/dcurran/Documents/Projects/RHDH/rhdh/remote_testing/BACKEND_INIT_ERROR_PLACE_PATCHED \
  rhdh-vault-test/backstage-rhdh-vault-test-6f999df6d9-gs7xf:/tmp/BackendInitializer.cjs.js

echo ""
echo "Step 2: Backup original file and replace with patched version"
kubectl exec -it backstage-rhdh-vault-test-6f999df6d9-gs7xf -n rhdh-vault-test -- bash -c "\
  cp /opt/app-root/src/node_modules/@backstage/backend-app-api/dist/wiring/BackendInitializer.cjs.js \
     /opt/app-root/src/node_modules/@backstage/backend-app-api/dist/wiring/BackendInitializer.cjs.js.backup && \
  cp /tmp/BackendInitializer.cjs.js \
     /opt/app-root/src/node_modules/@backstage/backend-app-api/dist/wiring/BackendInitializer.cjs.js"

echo ""
echo "Step 3: Get deployment name to restart pod"
DEPLOYMENT=$(kubectl get pod backstage-rhdh-vault-test-6f999df6d9-gs7xf -n rhdh-vault-test -o jsonpath='{.metadata.ownerReferences[0].name}')
echo "Deployment: $DEPLOYMENT"

echo ""
echo "Step 4: Restart the deployment"
kubectl rollout restart deployment/$DEPLOYMENT -n rhdh-vault-test

echo ""
echo "Step 5: Wait for new pod to be ready"
kubectl rollout status deployment/$DEPLOYMENT -n rhdh-vault-test

echo ""
echo "Step 6: Get new pod name"
NEW_POD=$(kubectl get pods -n rhdh-vault-test -l app.kubernetes.io/instance=rhdh-vault-test -o jsonpath='{.items[0].metadata.name}')
echo "New pod: $NEW_POD"

echo ""
echo "Step 7: Watch logs for debug output"
echo "Run this command to see the debug logs:"
echo "kubectl logs -f $NEW_POD -n rhdh-vault-test | grep -E '(DEBUG:|ERROR:|Module|Plugin)'"
