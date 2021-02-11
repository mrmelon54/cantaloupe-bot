FROM melon/debian-for-discord-vc

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm audit fix

COPY . .
RUN chmod +x espeak

EXPOSE 8080
CMD [ "npm", "start" ]
