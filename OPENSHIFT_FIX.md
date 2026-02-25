# Fix for ImagePullBackOff Error

## Problem

You're getting this error:
```
Failed to pull image "testapp:latest": reading manifest latest in docker.io/library/testapp: requested access to the resource is denied
Error: ImagePullBackOff
```

This happens because OpenShift is trying to pull the image from Docker Hub, but the image doesn't exist there yet.

## Solution

You need to build the image in OpenShift first. Follow these steps:

### Step 1: Delete the Current Deployment

```bash
oc delete deployment testapp
```

### Step 2: Create BuildConfig and ImageStream

```bash
oc apply -f openshift/buildconfig.yaml
```

This creates:
- An ImageStream to store your built image
- A BuildConfig that builds from your GitHub repository

### Step 3: Start the Build

```bash
# Trigger a build from your GitHub repository
oc start-build testapp --follow
```

Wait for the build to complete. You should see output like:
```
Cloning "https://github.com/robibanogon/testapp.git" ...
...
Successfully pushed image-registry.openshift-image-registry.svc:5000/test-app/testapp@sha256:...
Push successful
```

### Step 4: Verify the Image

```bash
# Check if the image was created
oc get imagestream testapp

# You should see something like:
# NAME      IMAGE REPOSITORY                                                    TAGS      UPDATED
# testapp   image-registry.openshift-image-registry.svc:5000/test-app/testapp   latest    2 minutes ago
```

### Step 5: Deploy the Application

```bash
oc apply -f openshift/deployment.yaml
```

### Step 6: Verify Deployment

```bash
# Check pods
oc get pods

# You should see pods running:
# NAME                       READY   STATUS    RESTARTS   AGE
# testapp-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
```

## Alternative: Build from Local Source

If you want to build from your local code instead of GitHub:

```bash
# Create BuildConfig for binary builds
oc new-build --name=testapp --binary --strategy=docker

# Build from current directory
oc start-build testapp --from-dir=. --follow

# Then deploy
oc apply -f openshift/deployment.yaml
```

## Quick Fix Script

Run all commands at once:

```bash
#!/bin/bash

# Delete old deployment if exists
oc delete deployment testapp 2>/dev/null || true

# Create build configuration
oc apply -f openshift/buildconfig.yaml

# Start build
oc start-build testapp --follow

# Wait a moment for image to be available
sleep 5

# Deploy application
oc apply -f openshift/deployment.yaml

# Check status
echo "Checking deployment status..."
oc get pods -l app=testapp
```

Save this as `deploy.sh`, make it executable, and run:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Verify Everything is Working

```bash
# Check all resources
oc get all

# Check pods are running
oc get pods

# Check logs
oc logs -f deployment/testapp

# Get the route URL
oc get route testapp -o jsonpath='{.spec.host}'
```

## Common Issues

### Build Fails

If the build fails, check the logs:
```bash
oc logs -f bc/testapp
```

### Pod Still Not Starting

Check pod events:
```bash
oc describe pod <pod-name>
```

### Image Not Found

Make sure the ImageStream exists:
```bash
oc get is testapp
```

If it doesn't exist, recreate it:
```bash
oc apply -f openshift/buildconfig.yaml
oc start-build testapp --follow
```

## Summary

The key issue was that the deployment was trying to pull `testapp:latest` from Docker Hub, but you need to:

1. Build the image in OpenShift first using BuildConfig
2. The image will be stored in OpenShift's internal registry
3. Then deploy using that internal image

The updated `deployment.yaml` now points to the correct internal registry path:
```yaml
image: image-registry.openshift-image-registry.svc:5000/test-app/testapp:latest