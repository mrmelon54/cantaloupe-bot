FROM alpine:3.8
RUN apk add --no-cache --update nodejs npm build-base libtool autoconf

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm audit fix

COPY . .

RUN apk del --no-cache build-base libtool autoconf

EXPOSE 8080
CMD [ "npm", "start" ]
