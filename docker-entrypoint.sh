#!/bin/sh
cat <<EOF > /usr/share/nginx/html/env.js
window.__ODOT_SYNC_URL__ = "${SYNC_URL:-}";
window.__ODOT_LOCALE__ = "${LOCALE:-}";
EOF
exec "$@"
