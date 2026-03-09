#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
PROJECT_ID="${GOOGLE_PROJECT_ID:?Set GOOGLE_PROJECT_ID}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
AGENT_IMAGE="gcr.io/${PROJECT_ID}/nexus-agent"
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/nexus-frontend"

echo "=== NEXUS Deploy to Cloud Run ==="
echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"
echo ""

# ── Build & Push Images ───────────────────────────────────────
echo "Building agent image..."
gcloud builds submit --project="${PROJECT_ID}" --tag="${AGENT_IMAGE}" ../agent/

echo "Building frontend image..."
gcloud builds submit --project="${PROJECT_ID}" --tag="${FRONTEND_IMAGE}" ../frontend/

# ── Deploy Agent Service ──────────────────────────────────────
echo "Deploying agent service..."
gcloud run deploy nexus-agent \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${AGENT_IMAGE}" \
  --memory=1Gi \
  --cpu=1 \
  --timeout=3600 \
  --concurrency=10 \
  --allow-unauthenticated \
  --set-secrets="E2B_API_KEY=e2b-api-key:latest,GOOGLE_API_KEY=google-api-key:latest" \
  --set-env-vars="FRONTEND_URL=https://nexus-frontend-${PROJECT_ID}.run.app"

AGENT_URL=$(gcloud run services describe nexus-agent \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='value(status.url)')

echo "Agent URL: ${AGENT_URL}"

# ── Deploy Frontend Service ───────────────────────────────────
echo "Deploying frontend service..."
gcloud run deploy nexus-frontend \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${FRONTEND_IMAGE}" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=80 \
  --allow-unauthenticated \
  --set-env-vars="AGENT_URL=${AGENT_URL},NEXT_PUBLIC_AGENT_WS_URL=${AGENT_URL/https/wss}"

FRONTEND_URL=$(gcloud run services describe nexus-frontend \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='value(status.url)')

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: ${FRONTEND_URL}"
echo "Agent:    ${AGENT_URL}"
