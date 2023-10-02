FROM node:18-alpine
WORKDIR /app
COPY . /app/
RUN npm install -g serve
CMD [ "npx", "serve", "-p", "80" ]
