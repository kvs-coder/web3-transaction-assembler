FROM node:18

WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

CMD ["yarn", "start"]