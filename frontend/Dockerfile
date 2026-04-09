# Stage 1: Build the Vite/React app
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# These will be set at build time via --build-arg
ARG VITE_BASE_URL=""
ARG VITE_ALLWAYS_LOGGED_IN="true"

# Write the .env file so Vite picks up the values during build
RUN echo "VITE_BASE_URL=${VITE_BASE_URL}" > .env && \
    echo "VITE_ALLWAYS_LOGGED_IN=${VITE_ALLWAYS_LOGGED_IN}" >> .env

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config for SPA routing
COPY --from=build /app/dist /usr/share/nginx/html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
