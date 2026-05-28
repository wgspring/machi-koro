FROM docker.m.daocloud.io/library/node:20

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmjs.org && npm install && npm install @rolldown/binding-linux-arm64-gnu@1.0.0

COPY . .

CMD ["npm", "run", "dev"]
