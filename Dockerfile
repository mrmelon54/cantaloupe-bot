FROM melon/debian-for-discord-vc

WORKDIR /usr/src/app

COPY package*.json ./

RUN apt-get install espeak ffmpeg -y

RUN npm install
RUN npm audit fix

RUN mkdir -p recordings

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
