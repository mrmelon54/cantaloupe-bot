FROM alpine:3.8
RUN apk add --no-cache --update nodejs npm

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm audit fix

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
