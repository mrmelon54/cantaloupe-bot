FROM melon/debian-for-discord-vc

WORKDIR /usr/src/app

COPY package*.json ./

RUN apt-get --allow-releaseinfo-change update
RUN apt-get install espeak ffmpeg -y
RUN apt-get clean

RUN npm install

RUN mkdir -p recordings

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
