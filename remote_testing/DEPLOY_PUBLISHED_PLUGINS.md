# Deploy RHDH with Published Vault Plugins

This guide shows how to deploy RHDH using vault plugins published to GitHub Packages.

## Prerequisites

- OpenShift cluster access
- `oc` CLI installed and logged in
- GitHub Personal Access Token with `write:packages` and `read:packages` permissions

## Step 1: Publish Plugins to GitHub Packages

### One-Time Setup

The GitHub Actions workflow is already configured. Just push your code:

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare vault plugins for publishing"
git push origin vaultPlugin
```

The workflow `.github/workflows/publish-vault-plugins.yml` will automatically:
1. Build the vault plugins
2. Publish them to GitHub Packages at:
   - `@dcurran90/backstage-plugin-rhdh-vault@0.1.0`
   - `@dcurran90/backstage-plugin-rhdh-vault-backend@0.1.0`
   - `@dcurran90/backstage-plugin-scaffolder-backend-module-vault-secret-add-module@0.1.0`

### Verify Publication

Check that packages were published:
```bash
# Go to https://github.com/dcurran90?tab=packages
# You should see 3 packages listed
```

## Step 2: Create GitHub Token for RHDH

RHDH needs to authenticate to GitHub Packages to install your plugins.

### Create Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "RHDH Vault Plugins"
4. Select scopes:
   - ✅ `read:packages`
5. Click "Generate token"
6. **Copy the token** (you won't see it again)

## Step 3: Deploy to OpenShift

### 3.1 Deploy Vault (Optional - for testing)

```bash
oc apply -f vault/vault-deployment.yaml
oc wait --for=condition=ready pod -l app=vault -n vault-testing --timeout=300s
```

### 3.2 Create RHDH Namespace and Secrets

```bash
# Create namespace
oc new-project rhdh-vault-test

# Create Vault configuration
oc create secret generic rhdh-vault-secrets \
  --from-literal=VAULT_ADDR="http://vault.rhdh-vault-test.svc.cluster.local:8200" \
  --from-literal=VAULT_TOKEN="root"

# Create GitHub token for catalog (optional)
oc create secret generic rhdh-github-secrets \
  --from-literal=GITHUB_TOKEN="your-github-token-here"

# Create .npmrc for GitHub Packages authentication
# IMPORTANT: Replace YOUR_GITHUB_TOKEN with the token from Step 2
oc create secret generic npmrc \
  --from-literal=.npmrc="@dcurran90:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN"
```

### 3.3 Deploy ConfigMaps

```bash
# App configuration
oc apply -f manifests/configmap-app-config.yaml

# Dynamic plugins configuration (references published packages)
oc apply -f manifests/configmap-dynamic-plugins-published.yaml
```

### 3.4 Install RHDH Operator (if needed)

```bash
oc apply -f manifests/operator-subscription.yaml
oc wait --for=condition=ready pod -l name=rhdh-operator -n rhdh-operator --timeout=600s
```

### 3.5 Deploy RHDH Instance

```bash
oc apply -f manifests/rhdh-instance-published-plugins.yaml
```

### 3.6 Monitor Deployment

```bash
# Watch pod creation
oc get pods -w

# Once running, check logs
POD=$(oc get pods -l app=backstage -o jsonpath='{.items[0].metadata.name}')
oc logs $POD -c backstage -f
```

Look for plugin installation messages:
```
Installing dynamic plugins...
Installing @dcurran90/backstage-plugin-rhdh-vault@0.1.0
Installing @dcurran90/backstage-plugin-rhdh-vault-backend@0.1.0
Installing @dcurran90/backstage-plugin-scaffolder-backend-module-vault-secret-add-module@0.1.0
```

### 3.7 Access RHDH

```bash
RHDH_URL=$(oc get route rhdh-vault-test -o jsonpath='{.spec.host}')
echo "RHDH URL: https://${RHDH_URL}"
```

Test:
- **Vault UI**: `https://${RHDH_URL}/rhdh-vault`
- **Scaffolder**: `https://${RHDH_URL}/create`

## Updating Plugins

When you make changes to vault plugins:

```bash
# 1. Update version in package.json files
# For example, change from 0.1.0 to 0.1.1

# 2. Commit and push
git add .
git commit -m "Update vault plugins to v0.1.1"
git push origin vaultPlugin

# 3. Wait for GitHub Actions to publish new version

# 4. Update ConfigMap to use new version
oc edit configmap dynamic-plugins-vault
# Change @0.1.0 to @0.1.1 for all vault plugins

# 5. Restart RHDH pod
oc delete pod -l app=backstage
```

## Deployment Timeline

- **Publish plugins** (GitHub Actions): 3-5 minutes (one-time or on updates)
- **Pod startup** (download & install): 1-2 minutes
- **Total**: ~5-7 minutes (much faster than building!)

## Advantages

✅ **Fast startup** - Plugins are pre-built, just downloaded
✅ **Simple config** - Just package names and versions
✅ **Versioned** - Can pin to specific versions
✅ **Cacheable** - Downloaded once, cached
✅ **No initContainer** - Simple pod spec

## Troubleshooting

### Plugins Fail to Install

Check logs for authentication errors:
```bash
oc logs $POD -c backstage | grep -i "404\|401\|403"
```

Common issues:
- **404 Not Found**: Plugins not published yet, check GitHub Actions
- **401 Unauthorized**: Wrong GitHub token in `.npmrc` secret
- **403 Forbidden**: GitHub token doesn't have `read:packages` permission

Fix `.npmrc` secret:
```bash
oc delete secret npmrc
oc create secret generic npmrc \
  --from-literal=.npmrc="@dcurran90:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_CORRECT_TOKEN"
oc delete pod -l app=backstage
```

### Check Package Visibility

Packages must be public or accessible with your token:
1. Go to package settings on GitHub
2. Under "Danger Zone", change visibility to public if needed

### Verify .npmrc is Mounted

```bash
oc exec $POD -- cat /opt/app-root/src/.npmrc
```

Should show:
```
@dcurran90:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_xxxxx
```

## Cleanup

```bash
oc delete backstage rhdh-vault-test
oc delete project rhdh-vault-test vault-testing
```

## Production Checklist

- [ ] Use external Vault (not dev mode)
- [ ] Use external PostgreSQL
- [ ] Enable authentication in RHDH
- [ ] Use production GitHub token (not personal)
- [ ] Set resource limits appropriately
- [ ] Enable RBAC
- [ ] Configure TLS certificates
- [ ] Set up monitoring/logging
