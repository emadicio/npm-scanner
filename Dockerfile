# Build
FROM node:14.16.0-alpine3.12
COPY . ./app
WORKDIR /app
RUN npm install
RUN npm run build
