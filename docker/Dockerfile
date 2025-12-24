FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npx hardhat compile

EXPOSE 8545

CMD ["sh", "./docker/entrypoint.sh"]
