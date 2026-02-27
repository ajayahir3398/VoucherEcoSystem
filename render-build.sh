#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Installing dependencies ---"
npm install

echo "--- Injecting API URL into environment.ts ---"
# Create the environment file if it doesn't exist or overwrite it
mkdir -p apps/web/src/environments
cat <<EOF > apps/web/src/environments/environment.prod.ts
export const environment = {
    production: true,
    apiUrl: 'https://${API_URL}'
};
EOF

# Also update the default environment just in case
cat <<EOF > apps/web/src/environments/environment.ts
export const environment = {
    production: true,
    apiUrl: 'https://${API_URL}'
};
EOF

echo "--- Building API ---"
npx nx build api

echo "--- Building Web ---"
npx nx build web

echo "--- Build complete ---"
