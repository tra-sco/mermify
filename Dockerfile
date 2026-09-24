# syntax=docker/dockerfile:1

FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginxinc/nginx-unprivileged:1-alpine
LABEL org.opencontainers.image.source="https://tra-sco/mermify"
LABEL org.opencontainers.image.description="Mermify visual Mermaid.js diagram editor"
LABEL org.opencontainers.image.licenses="MIT"
COPY --chown=101:101 --from=build /app/dist /usr/share/nginx/html
COPY --chown=101:101 <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_tokens off;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    # worker-src blob: for Monaco; wasm-unsafe-eval: for mermaid.js/PWA SW
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; script-src 'self' 'wasm-unsafe-eval'";

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    root /usr/share/nginx/html;
    index index.html;

    # VitePress inlines a per-build script, so unsafe-inline is scoped to /docs only.
    location /docs/ {
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header Referrer-Policy strict-origin-when-cross-origin;
        add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'";
        try_files $uri $uri/ /docs/index.html;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
EXPOSE 8080
