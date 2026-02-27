#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Installing dependencies ---"
npm install --include=dev

echo "--- Injecting API URL into environment.ts ---"
# Check if API_URL is just the service name and append domain if so
if [[ $API_URL != *".onrender.com"* ]]; then
    FINAL_API_URL="${API_URL}.onrender.com"
else
    FINAL_API_URL="${API_URL}"
fi

echo "Using FINAL_API_URL: https://${FINAL_API_URL}"

# Create the environment file if it doesn't exist or overwrite it
mkdir -p apps/web/src/environments
cat <<EOF > apps/web/src/environments/environment.ts
export const environment = {
    production: true,
    apiUrl: 'https://${FINAL_API_URL}'
};
EOF

# Ensure environment.prod.ts is also updated
cp apps/web/src/environments/environment.ts apps/web/src/environments/environment.prod.ts

echo "--- Building API ---"
npx nx build api

echo "--- Building Web ---"
npx nx build web --skip-nx-cache

echo "--- Build complete ---"
