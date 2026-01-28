# Remote Testing - OpenShift Deployment

This directory contains everything needed to deploy your RHDH fork with Vault plugins to an OpenShift cluster.

## Prerequisites

- OpenShift cluster access with cluster-admin or appropriate permissions
- `oc` CLI installed and logged in
- Container registry access (Quay.io, Docker Hub, or OpenShift internal registry)
- Vault instance (can be deployed in-cluster using provided manifests)

## Deployment Steps

### 1. Build and Push Container Image

Build the RHDH image with your vault plugins from the `vaultPlugin` branch:

```bash
# Login to your container registry
podman login quay.io  # or docker login

# Set your registry and image name
export REGISTRY="quay.io"
export REGISTRY_USER="your-username"
export IMAGE_TAG="vaultPlugin"

# Build the image
cd /Users/dcurran/Documents/Projects/RHDH/rhdh-vaultplugin
podman build -f docker/Dockerfile -t ${REGISTRY}/${REGISTRY_USER}/rhdh:${IMAGE_TAG} .

# Push the image
podman push ${REGISTRY}/${REGISTRY_USER}/rhdh:${IMAGE_TAG}
```

**Alternative: Use GitHub Actions**

The repo has existing workflows that can build images. Check `.github/workflows/pr-build-image.yaml` for automated builds.

### 2. Deploy Vault (Optional)

If you don't have an existing Vault instance, deploy one in your cluster:

```bash
oc new-project vault-testing

# Deploy Vault in dev mode (NOT for production)
oc apply -f remote_testing/vault/vault-deployment.yaml

# Wait for Vault to be ready
oc wait --for=condition=ready pod -l app=vault --timeout=300s

# Get Vault token (dev mode uses 'root' token by default)
export VAULT_TOKEN=root
export VAULT_ADDR=$(oc get route vault -o jsonpath='{.spec.host}')

echo "Vault Address: http://${VAULT_ADDR}"
echo "Vault Token: ${VAULT_TOKEN}"
```

### 3. Create RHDH Namespace and Secrets

```bash
oc new-project rhdh-vault-test

# Create secret with Vault configuration
oc create secret generic rhdh-vault-secrets \
  --from-literal=VAULT_ADDR="http://vault.vault-testing.svc.cluster.local:8200" \
  --from-literal=VAULT_TOKEN="root"

# Create secret for GitHub integration (optional, for catalog)
oc create secret generic rhdh-github-secrets \
  --from-literal=GITHUB_TOKEN="your-github-token"
```

### 4. Deploy ConfigMaps

```bash
# Create app-config ConfigMap with Vault configuration
oc apply -f remote_testing/manifests/configmap-app-config.yaml

# Create dynamic plugins ConfigMap
oc apply -f remote_testing/manifests/configmap-dynamic-plugins.yaml
```

### 5. Install RHDH Operator

If the RHDH operator isn't already installed:

```bash
# Install from OperatorHub
oc apply -f remote_testing/manifests/operator-subscription.yaml

# Wait for operator to be ready
oc wait --for=condition=ready pod -l name=rhdh-operator -n rhdh-operator --timeout=300s
```

### 6. Deploy RHDH Instance

Update the image reference in `manifests/rhdh-instance.yaml` with your image:

```bash
# Edit the image reference
vi remote_testing/manifests/rhdh-instance.yaml
# Change: quay.io/YOUR_USERNAME/rhdh:vaultPlugin

# Deploy RHDH
oc apply -f remote_testing/manifests/rhdh-instance.yaml

# Wait for RHDH to be ready
oc wait --for=condition=ready backstage rhdh-vault-test --timeout=600s

# Get the route
export RHDH_URL=$(oc get route rhdh-vault-test -o jsonpath='{.spec.host}')
echo "RHDH URL: https://${RHDH_URL}"
```

### 7. Test Vault Plugins

Once RHDH is running:

1. **Access RHDH**: Navigate to `https://${RHDH_URL}`
2. **View Vault Secrets**: Go to `/rhdh-vault` to see the Vault UI plugin
3. **Test Scaffolder Actions**: Go to `/create` and select one of the vault templates:
   - `test-vault-add-secret`
   - `test-vault-get-secret`
   - `test-vault-delete-secret`

### 8. Verify Dynamic Plugins Loaded

Check that the vault plugins are loaded:

```bash
# Check pod logs
oc logs -l app=backstage -c backstage | grep -i vault

# Expected output should show:
# - Loading plugin: scaffolder-backend-module-vault-secret-add-module
# - Loading plugin: rhdh-vault-backend
# - Loading plugin: rhdh-vault
```

## Configuration Details

### Vault Configuration

The app-config includes:

```yaml
rhdhVault:
  baseUrl: ${VAULT_ADDR}
  token: ${VAULT_TOKEN}
```

### Dynamic Plugins

The vault plugins are configured as embedded plugins:

```yaml
- package: ./dynamic-plugins/dist/backstage-plugin-scaffolder-backend-module-vault-secret-add-module-dynamic
  disabled: false
- package: ./dynamic-plugins/dist/backstage-plugin-rhdh-vault-backend-dynamic
  disabled: false
- package: ./dynamic-plugins/dist/backstage-plugin-rhdh-vault
  disabled: false
```

## Troubleshooting

### Image Pull Errors

If the image can't be pulled:

```bash
# Check if image is public or create pull secret
oc create secret docker-registry quay-pull-secret \
  --docker-server=quay.io \
  --docker-username=${REGISTRY_USER} \
  --docker-password=${REGISTRY_PASSWORD}

# Link to service account
oc secrets link default quay-pull-secret --for=pull
```

### Plugin Load Failures

Check the backend logs:

```bash
oc logs -l app=backstage -c backstage --tail=100 -f
```

### Vault Connection Issues

Test connectivity from within the pod:

```bash
# Get pod name
POD=$(oc get pods -l app=backstage -o jsonpath='{.items[0].metadata.name}')

# Test Vault connection
oc exec ${POD} -- curl -H "X-Vault-Token: root" http://vault.vault-testing.svc.cluster.local:8200/v1/sys/health
```

## Cleanup

To remove everything:

```bash
# Delete RHDH instance
oc delete backstage rhdh-vault-test

# Delete namespace
oc delete project rhdh-vault-test

# Delete Vault (if deployed)
oc delete project vault-testing
```

## Production Considerations

This setup is for TESTING ONLY. For production:

1. **Don't use Vault dev mode** - deploy a proper HA Vault cluster
2. **Use proper secrets management** - don't hardcode tokens
3. **Enable authentication** - remove `dangerouslyDisableDefaultAuthPolicy`
4. **Use HTTPS** - configure proper TLS certificates
5. **Use PostgreSQL** - configure external database instead of SQLite
6. **Resource limits** - set appropriate CPU/memory limits
7. **RBAC** - enable proper role-based access control
