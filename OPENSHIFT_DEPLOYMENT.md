# Deploying Gadget Store to Red Hat OpenShift

This guide explains how to deploy the Gadget Store e-commerce application to Red Hat OpenShift.

## Prerequisites

- Access to a Red Hat OpenShift cluster
- `oc` CLI tool installed and configured
- Docker or Podman for building images
- Access to an image registry (OpenShift internal registry, Docker Hub, Quay.io, etc.)

## Architecture

The deployment consists of:
- **Application Pod**: Node.js application (2 replicas for high availability)
- **PostgreSQL Pod**: Database with persistent storage
- **Service**: Internal cluster networking
- **Route**: External HTTPS access
- **Secret**: Database credentials

## Quick Deployment

### 1. Login to OpenShift

```bash
oc login <your-openshift-cluster-url>
```

### 2. Create a New Project

```bash
oc new-project gadget-store
```

### 3. Build and Push Docker Image

**Option A: Using OpenShift Internal Registry**

```bash
# Build the image
docker build -t gadget-store:latest .

# Tag for OpenShift registry
docker tag gadget-store:latest image-registry.openshift-image-registry.svc:5000/gadget-store/gadget-store:latest

# Login to OpenShift registry
docker login -u $(oc whoami) -p $(oc whoami -t) image-registry.openshift-image-registry.svc:5000

# Push the image
docker push image-registry.openshift-image-registry.svc:5000/gadget-store/gadget-store:latest
```

**Option B: Using Docker Hub**

```bash
# Build and tag
docker build -t your-dockerhub-username/gadget-store:latest .

# Push to Docker Hub
docker push your-dockerhub-username/gadget-store:latest

# Update deployment.yaml to use your image
```

**Option C: Using OpenShift BuildConfig (Recommended)**

```bash
# Create a BuildConfig from Dockerfile
oc new-build --name=gadget-store --binary --strategy=docker

# Start the build
oc start-build gadget-store --from-dir=. --follow

# The image will be automatically available in the internal registry
```

### 4. Update Database Secret

Edit `openshift/secret.yaml` and change the password:

```bash
# Generate a secure password
openssl rand -base64 32

# Update the password in secret.yaml
```

### 5. Deploy PostgreSQL Database

```bash
oc apply -f openshift/secret.yaml
oc apply -f openshift/postgresql.yaml
```

Wait for PostgreSQL to be ready:

```bash
oc get pods -w
```

### 6. Initialize Database Schema

```bash
# Get the PostgreSQL pod name
POD_NAME=$(oc get pods -l app=postgresql -o jsonpath='{.items[0].metadata.name}')

# Copy schema file to pod
oc cp database/schema.sql $POD_NAME:/tmp/schema.sql

# Execute schema
oc exec $POD_NAME -- psql -U gadget_user -d gadget_store -f /tmp/schema.sql
```

### 7. Deploy Application

```bash
# Update the image in deployment.yaml if needed
# Then apply all configurations
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml
```

### 8. Verify Deployment

```bash
# Check all resources
oc get all

# Check pods are running
oc get pods

# Check route URL
oc get route gadget-store
```

### 9. Access the Application

```bash
# Get the application URL
echo "https://$(oc get route gadget-store -o jsonpath='{.spec.host}')"
```

Visit the URL in your browser!

## Manual Deployment Steps

### Step 1: Create Secret

```bash
oc create secret generic gadget-store-db-secret \
  --from-literal=host=postgresql \
  --from-literal=port=5432 \
  --from-literal=database=gadget_store \
  --from-literal=username=gadget_user \
  --from-literal=password=YOUR_SECURE_PASSWORD
```

### Step 2: Deploy PostgreSQL

```bash
# Create PVC
oc apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgresql-data
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
EOF

# Deploy PostgreSQL
oc new-app postgresql-persistent \
  --name=postgresql \
  --env=POSTGRESQL_USER=gadget_user \
  --env=POSTGRESQL_PASSWORD=YOUR_SECURE_PASSWORD \
  --env=POSTGRESQL_DATABASE=gadget_store
```

### Step 3: Build Application

```bash
# Create BuildConfig
oc new-build --name=gadget-store \
  --binary \
  --strategy=docker

# Build from source
oc start-build gadget-store --from-dir=. --follow
```

### Step 4: Deploy Application

```bash
# Create deployment
oc new-app gadget-store \
  --name=gadget-store

# Set environment variables
oc set env deployment/gadget-store \
  --from=secret/gadget-store-db-secret \
  --prefix=DB_

# Expose service
oc expose svc/gadget-store
```

## Configuration

### Environment Variables

The application uses these environment variables:

- `NODE_ENV`: Set to "production"
- `PORT`: Application port (default: 8080)
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password

### Resource Limits

Default resource limits:

**Application:**
- Requests: 256Mi memory, 100m CPU
- Limits: 512Mi memory, 500m CPU

**PostgreSQL:**
- Requests: 256Mi memory, 100m CPU
- Limits: 512Mi memory, 500m CPU

Adjust in the YAML files as needed.

## Scaling

### Scale Application

```bash
# Scale to 3 replicas
oc scale deployment/gadget-store --replicas=3

# Auto-scale based on CPU
oc autoscale deployment/gadget-store \
  --min=2 \
  --max=5 \
  --cpu-percent=80
```

### Scale Database

**Note:** PostgreSQL is stateful and should typically run as a single replica. For high availability, consider using PostgreSQL with replication or a managed database service.

## Monitoring

### View Logs

```bash
# Application logs
oc logs -f deployment/gadget-store

# Database logs
oc logs -f deployment/postgresql

# Logs from specific pod
oc logs -f <pod-name>
```

### Check Pod Status

```bash
# Get all pods
oc get pods

# Describe pod
oc describe pod <pod-name>

# Get events
oc get events --sort-by='.lastTimestamp'
```

### Health Checks

The application includes:
- **Liveness Probe**: Checks if app is running
- **Readiness Probe**: Checks if app is ready to serve traffic

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
oc describe pod <pod-name>

# Check logs
oc logs <pod-name>

# Check events
oc get events
```

### Database Connection Issues

```bash
# Test database connectivity
oc exec deployment/gadget-store -- nc -zv postgresql 5432

# Check database logs
oc logs deployment/postgresql

# Verify secret
oc get secret gadget-store-db-secret -o yaml
```

### Image Pull Errors

```bash
# Check image stream
oc get is

# Check build logs
oc logs bc/gadget-store

# Rebuild if needed
oc start-build gadget-store --follow
```

### Route Not Working

```bash
# Check route
oc get route gadget-store

# Describe route
oc describe route gadget-store

# Check service endpoints
oc get endpoints gadget-store
```

## Updating the Application

### Update Code

```bash
# Rebuild image
oc start-build gadget-store --from-dir=. --follow

# Rollout new version
oc rollout latest deployment/gadget-store

# Check rollout status
oc rollout status deployment/gadget-store
```

### Rollback

```bash
# View rollout history
oc rollout history deployment/gadget-store

# Rollback to previous version
oc rollout undo deployment/gadget-store

# Rollback to specific revision
oc rollout undo deployment/gadget-store --to-revision=2
```

## Backup and Restore

### Backup Database

```bash
# Create backup
oc exec deployment/postgresql -- pg_dump -U gadget_user gadget_store > backup.sql

# Or backup to pod
oc exec deployment/postgresql -- pg_dump -U gadget_user gadget_store -f /tmp/backup.sql
oc cp postgresql-pod:/tmp/backup.sql ./backup.sql
```

### Restore Database

```bash
# Copy backup to pod
oc cp backup.sql postgresql-pod:/tmp/backup.sql

# Restore
oc exec deployment/postgresql -- psql -U gadget_user -d gadget_store -f /tmp/backup.sql
```

## Security Best Practices

1. **Use Secrets**: Never hardcode credentials
2. **HTTPS Only**: Route uses TLS termination
3. **Non-root User**: Container runs as non-root
4. **Resource Limits**: Set appropriate limits
5. **Network Policies**: Restrict pod-to-pod communication
6. **Regular Updates**: Keep base images updated
7. **Scan Images**: Use image scanning tools

## Production Considerations

### High Availability

- Run multiple application replicas (minimum 2)
- Use PostgreSQL with replication or managed service
- Configure pod anti-affinity
- Use multiple availability zones

### Performance

- Enable horizontal pod autoscaling
- Use persistent storage with good IOPS
- Configure connection pooling
- Enable caching where appropriate

### Monitoring

- Set up Prometheus metrics
- Configure alerting
- Use OpenShift monitoring dashboard
- Enable application performance monitoring (APM)

### Backup Strategy

- Automated daily database backups
- Store backups in external storage
- Test restore procedures regularly
- Document recovery procedures

## Clean Up

To remove all resources:

```bash
# Delete all resources
oc delete all -l app=gadget-store
oc delete all -l app=postgresql
oc delete pvc postgresql-data
oc delete secret gadget-store-db-secret

# Or delete the entire project
oc delete project gadget-store
```

## Additional Resources

- [OpenShift Documentation](https://docs.openshift.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [PostgreSQL on OpenShift](https://docs.openshift.com/container-platform/latest/applications/databases.html)
- [Container Best Practices](https://docs.openshift.com/container-platform/latest/openshift_images/create-images.html)

## Support

For issues or questions:
- Check application logs: `oc logs deployment/gadget-store`
- Review OpenShift events: `oc get events`
- Consult OpenShift documentation
- Contact your cluster administrator