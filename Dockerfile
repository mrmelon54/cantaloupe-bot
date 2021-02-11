FROM alpine:3.8
RUN apk add --no-cache --update nodejs npm build-base libtool autoconf automake python2

WORKDIR /usr/src/app

COPY package*.json ./

RUN ln -s /usr/bin/python2 /usr/bin/python
RUN npm config set python /usr/bin/python
RUN npm install
RUN npm audit fix

COPY . .

RUN apk del --no-cache build-base libtool autoconf automake

EXPOSE 8080
CMD [ "npm", "start" ]
