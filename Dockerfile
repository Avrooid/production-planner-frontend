FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD sh -c 'echo "window.__env = { SERVER_ADDRESS: \"${SERVER_ADDRESS}\" };" > /usr/share/nginx/html/assets/env.js && nginx -g "daemon off;"'
