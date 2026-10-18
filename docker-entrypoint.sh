#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL database to be reachable..."
MAX_RETRIES=30
RETRY_COUNT=0

until node ./node_modules/prisma/build/index.js db push --skip-generate; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ Database connection timed out after $MAX_RETRIES attempts."
    exit 1
  fi
  echo "Database is not ready yet - sleeping 2s (attempt $RETRY_COUNT/$MAX_RETRIES)..."
  sleep 2
done

echo "✅ Database schema synchronized successfully!"
echo "✨ Starting Komnottra server on port ${PORT:-3000}..."
exec node server.js
