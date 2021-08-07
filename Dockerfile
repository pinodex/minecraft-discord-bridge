FROM node:16.6-alpine3.11

ARG NODE_ENV=production
WORKDIR /app

COPY . .

RUN npm ci

ENTRYPOINT ["npm", "start"]
