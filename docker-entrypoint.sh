#!/bin/sh
cat <<EOF > /usr/share/nginx/html/env.js
window.__ODOT_SYNC_URL__ = "${SYNC_URL:-}";
EOF
exec "$@"
