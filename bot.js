const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const server = require("./server.js");
server.sendClient(client);
const algebra = require("algebra.js");
const http = require("http");
const { exec } = require("child_process");
const ytdl = require("ytdl-core");
const glob = require("glob");
const gitDownload = require("download-git-repo");
const validUrl = require("valid-url");
const request = require("request");

var mcIP = "mc.onpointcoding.net";
var almmcIP = "captainalmmc.skynode.host";
var mcPort = 25565;

const streamOptions = { seek: 0, volume: 1 };

var serverToken = "thiswasasecretpassword";

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateStatus();
});

function commandParser(_a) {
  var _o = {
    result: false,
    output: [""],
    isCmd: false
  };
  var strOpen = false;
  var strChar = "";
  for (var i = 0; i < _a.length; i++) {
    if (i == 0 && _a[i] == "~") {
      _o.isCmd = true;
      continue;
    }
    if (!strOpen && (_a[i] == '"' || _a[i] == "'")) {
      strChar = _a[i];
      strOpen = true;
      continue;
    }
    if (strOpen && _a[i] == strChar) {
      strOpen = false;
      continue;
    }
    if (!strOpen && _a[i] == " ") {
      _o.output.push("");
      continue;
    }
    _o.output[_o.output.length - 1] += _a[i];
  }
  if (!strOpen) _o.result = true;
  return _o;
}

function updateStatus() {
  client.user.setStatus(config.AboutMe.status.status);
  client.user.setActivity(config.AboutMe.status.activity, {
    type: config.AboutMe.status.presence.toUpperCase()
  });
}

client.on("message", async msg => {
  if (msg.author.bot) return;
  var cp = commandParser(msg.content);
  if (
    msg.content.toLowerCase().includes("nigga") ||
    msg.content.toLowerCase().includes("nigger") ||
    msg.content.toLowerCase().includes("niggar")
  ) {
    // excuse my use of this work but its to filter bad language
    msg.delete();
    for (var i = 0; i < 1; i++) {
      msg.channel
        .send(`**HEY, THAT'S RACIST U CAN'T SAY THE N WORD!!!**`)
        .then(m => {
          setTimeout(() => {
            m.delete();
          }, 5000);
        });
    }
    return;
  }
  if (msg.content.trim().toLowerCase() == "yeet") {
    msg.channel.send("YEET");
    return;
  }
  if (msg.content.trim().toLowerCase() == "oof") {
    msg.channel.send("Whoops");
    return;
  }
  if (msg.content.trim().toLowerCase() == "foof yeet") {
    var a = [
      "You died by activating too many bots!",
      "Too many bots found you!",
      "You were surrounded by bots. Give up now!"
    ];
    msg.channel.send(a[Math.floor(Math.random() * (a.length - 1))]);
    return;
  }
  if (msg.content.trim().toLowerCase() == "bruh") {
    var a = ["Bruh"];
    msg.channel.send(a[Math.floor(Math.random() * (a.length - 1))]);
  }
  if (
    ["/minecraft", "/mc"].includes(msg.content.trim().toLowerCase()) &&
    msg.guild.id.toString() == "571615112570601503"
  ) {
    getMCServerStatus(mcIP, msg);
    return;
  }
  if (
    ["/minecraft", "/mc"].includes(msg.content.trim().toLowerCase()) &&
    msg.guild.id.toString() == "665837764666982413"
  ) {
    getMCServerStatus(almmcIP, msg);
    return;
  }
  if (cp.isCmd) {
    var cmd = cp.output;

    if (cmd[0] == "help" && cmd.length == 1) {
      var e = new Discord.RichEmbed()
        .setTitle("Overlord Bot Help")
        .setDescription(fs.readFileSync("help.txt").toString());
      msg.channel.send(e);
      return;
    }

    if (cmd[0] == "ktaneidea") {
      switch (cmd.length) {
        case 1:
        case 2:
          switch (cmd[1]) {
            case "inprogress":
              getRandomIdea("inProgress").then(a => {
                msg.channel.send(generateItemInfoEmbed(a));
              });
              break;
            case "notready":
              getRandomIdea("notReady").then(a => {
                msg.channel.send(generateItemInfoEmbed(a));
              });
              break;
            case "unknown":
              getRandomIdea("unknown").then(a => {
                msg.channel.send(generateItemInfoEmbed(a));
              });
              break;
            case "ready":
            default:
              getRandomIdea("ready").then(a => {
                msg.channel.send(generateItemInfoEmbed(a));
              });
          }
      }
    } else if (msg.content.toLowerCase() == "~egg") {
      msg.channel.send("You think you found it do you well think again");
    } else if (msg.content.toLowerCase() == "~qr") {
      var embed = new Discord.RichEmbed().setImage(
        "https://cdn.discordapp.com/emojis/610611944772075555.png?v=1"
      );
      msg.channel.send(embed);
    } else if (cmd[0] == "emote" && cmd.length == 2) {
      msg.channel.send(
        client.emojis
          .find(
            x =>
              x.name.toLowerCase().replace(/_/g, "") ==
              cmd[1].toLowerCase().replace(/_/g, "")
          )
          .toString()
      );
    } else if (
      cmd[0] == "sudo" &&
      config.AboutMe.ownerId == msg.author.id &&
      cmd.length >= 2
    ) {
      var sendCmd = encodeURIComponent(
        msg.content.replace(`~sudo ${cmd[1]}`, "").trim()
      );
      if (cmd[1] == "me") cmd[1] = "melon-overlord";
      http.get(
        `http://mrmelon-bots-status.glitch.me/cmd/?token=${serverToken}&action=${sendCmd}&to=${
          cmd[1]
        }&guild=${msg.guild.id}&channel=${msg.channel.id}`
      );
    } else if (cmd[0] == "math") {
      if (cmd.length == 1) {
        msg.channel.send(
          `You have to send an equation to use \`~math\`\ne.g. \`~math "x^2 + 3x - 2 = 0"\` or \`~math 1+2\``
        );
        return;
      }
      cmd[1] = cmd[1].replace(/pi/g, Math.PI);
      var o = [false, false];
      for (var i = 0; i < cmd[1].length; i++) {
        if ("abcdefghijklmnopqrstuvwxyz".split("").includes(cmd[1][i])) {
          if (cmd.length == 3) {
            o = [true, true];
            break;
          } else if (cmd.length == 2) {
            o = [true, false];
            break;
          }
        }
      }
      if (o[0] == true) {
        if (o[1] == true) {
          try {
            var x1 = algebra.parse(cmd[1]);
          } catch (e) {
            msg.channel.send(
              `**Math Error**\nI can't understand the equation ${
                cmd[1]
              }\nPing MrMelon if I need more maths classes!`
            );
          }
          try {
            var ans = x1.solveFor(cmd[2]).toString();
            msg.channel.send(
              `The answer to "\`${cmd[1]}\`" for "${cmd[2]}" is ${ans}`
            );
          } catch (e) {
            msg.channel.send(
              `**Math Error**\nI can't solve the equation ${
                cmd[1]
              }\nPing MrMelon if I just fucked up!`
            );
          }
        } else {
          try {
            var x1 = algebra.parse(cmd[1]);
            msg.channel.send(
              `The equation simplifies to \`${x1.simplify().toString()}\``
            );
          } catch (e) {
            msg.channel.send(
              `**Math Error**\nI can't understand the equation ${
                cmd[1]
              }\nPing MrMelon if I need more maths classes!`
            );
          }
        }
      } else {
        try {
          var x1 = algebra.parse(cmd[1]);
          msg.channel.send(
            `The answer to "\`${cmd[1]}\`" is ${x1.simplify().toString()}`
          );
        } catch (e) {
          msg.channel.send(
            `**Math Error**\nI can't understand the equation ${
              cmd[1]
            }\nPing MrMelon if I need more maths classes!`
          );
        }
      }
    } else if (msg.content.toLowerCase() == "~revenge") {
      var vc = msg.member.voiceChannel;
      playSong(vc, "NeI-1Aq5CJw");
    } else if (
      ["yt", "youtube"].includes(cmd[0]) &&
      cmd.length == 2 &&
      msg.author.id == config.AboutMe.ownerId
    ) {
      var vc = msg.member.voiceChannel;
      playSong(vc, cmd[1]);
    } else if (
      msg.content.toLowerCase() == "~stop" &&
      msg.author.id == config.AboutMe.ownerId
    ) {
      var vc = msg.member.voiceChannel;
      vc.leave();
    } else if (
      msg.content.toLowerCase() == "~stopall" &&
      config.AboutMe.ownerId === msg.author.id
    ) {
      client.voiceConnections.map(b => b.channel.leave());
    } else if (
      cmd[0] == "say" &&
      cmd.length > 1 &&
      msg.author.id == config.AboutMe.ownerId
    ) {
      var vc = msg.member.voiceChannel;
      speak(vc, cmd.slice(1, cmd.length).join(" "));
    }
  }
});

function playSong(vc, song) {
  vc.join().then(conn => {
    const stream = ytdl(`https://www.youtube.com/watch?v=${song}`, {
      filter: "audioonly"
    });
    const dispatcher = conn.playStream(stream, streamOptions);
    dispatcher.on("end", end => {
      vc.leave();
    });
  });
}

function speak(vc, text) {
  var filename = `${__dirname}/recordings/speech-${new Date().getTime()}.wav`;
  exec(`"${__dirname}/espeak/espeak" "${text}" -w "${filename}"`, err => {
    if (err) {
      console.log(err);
      client.guilds
        .get("584382438688555019")
        .channels.get("593476194209366017")
        .send(
          "<@&590198302918836240> __**Error speaking**__\n" +
            JSON.stringify(err)
        );
      return;
    }

    vc.join().then(conn => {
      const dispatcher = conn.playFile(filename);
      dispatcher.on("end", end => {
        vc.leave();
      });
    });
  });
}

var isGitDownloadRunning = false;

var deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

function doGitDownloadKTaNEModIdeas() {
  if (isGitDownloadRunning)
    return new Promise((res, rej) => {
      rej("already running");
    });
  isGitDownloadRunning = true;
  return new Promise((res, rej) => {
    gitDownload(
      "github:mrmelon54/ktane-mod-ideas",
      "ktane-ideas-clone",
      err => {
        glob("./ktane-ideas-clone/modules/*.json", {}, function(er, files) {
          var oneBigJson = files.map(a => {
            try {
              return require("./" + a);
            } catch (e) {
              rej(
                `Error with "${a.replace("./ktane-ideas-clone", "<github>")}"`
              );
              return { error: true };
            }
          });
          oneBigJson = oneBigJson.filter(a => !a.error);
          fs.writeFile(
            "./ktane-ideas-meta.json",
            JSON.stringify(oneBigJson),
            error => {
              isGitDownloadRunning = false;
              if (error) rej(error);
              res(oneBigJson.length);
            }
          );
        });
      }
    );
  });
}

function doGitDownloadKTaNESolver() {
  if (isGitDownloadRunning)
    return new Promise((res, rej) => {
      rej("already running");
    });
  return new Promise((res, rej) => {
    rej("This is currently unvailable");
  });
  isGitDownloadRunning = true;
  return new Promise((res, rej) => {
    gitDownload("github:mrmelon54/ktane-solver", "ktane-solver-clone", err => {
      glob("./ktane-solver-clone/globalAssets/*.js", {}, function(er, gfiles) {
        var oneBigJson = require("./ktane-solver-clone/meta.json");
        oneBigJson.modules = oneBigJson.modules.map(a => {
          try {
            a.script = fs.readFileSync(
              "./ktane-solver-clone/modules/" + a.id + ".js",
              "utf8"
            );
            return a;
          } catch (e) {
            rej(`Error with "${a.id}.json"`);
            return { error: true };
          }
        });
        oneBigJson = oneBigJson.filter(a => !a.error);
        oneBigJson.global = gfiles.map(a => fs.readFileSync("./" + a, "utf8"));
        fs.writeFile(
          "./ktane-solver-meta.json",
          JSON.stringify(oneBigJson),
          error => {
            isGitDownloadRunning = false;
            if (error) rej(error);
            res({ m: oneBigJson.modules.length, g: oneBigJson.global.length });
          }
        );
      });
    });
  });
}

function generateItemInfoEmbed(data) {
  var modStates = {
    inProgress: "<:in_progress:585545462640017428>",
    ready: "<:ready:585545462942138368>",
    notReady: "<:not_ready:585545462602399744>",
    unknown: "<:unknown:585545462644211715>"
  };
  var stateColours = {
    inProgress: 0x00ff00,
    ready: 0xffff00,
    notReady: 0xff0000,
    unknown: 0x777777
  };
  var embed = new Discord.RichEmbed()
    .setTitle(modStates[data.state] + "   " + data.name.toString())
    .setColor(stateColours[data.state]);
  if (data.manualUrl !== "") {
    if (validUrl.isUri(data.manualUrl)) {
      embed.setURL(data.manualUrl.replace(/ /g, "%20"));
    } else {
      embed.setTitle(
        modStates[data.state] +
          "   " +
          data.name.toString() +
          " :: (Invalid manual URL)"
      );
    }
  }
  var o = "by " + data.author;
  if (data.description !== "") o += "\n" + data.description;
  if (data.notes !== "") o += "\n(" + data.notes + ")";
  embed.setDescription(o);
  return embed;
}

function getRandomIdea(t) {
  return new Promise((res, req) => {
    var d = require("./ktane-ideas-meta.json");
    var modIdea = undefined;
    var filteredIdeas = d.filter(a => a.state === t);
    if (filteredIdeas.length === 0) {
      res({
        name: "I couldn't find any ideas",
        description: "It looks like there aren't any",
        manualUrl: "",
        notes: "",
        state: "unknown",
        author: "KTaNE Mod Ideas Bot"
      });
    } else {
      while (modIdea === undefined || modIdea === null) {
        var modIdea = filteredIdeas[getRandomInt(0, d.length - 1)];
      }
      res(modIdea);
    }
  });
}

function getMCServerStatus(ip, msg) {
  var url = "https://api.mcsrvstat.us/2/" + ip;
  request(url, function(err, response, body) {
    if (err) {
      return msg.channel.send("Error getting Minecraft server status...");
    }
    body = JSON.parse(body);
    if (body.online) {
      var embed = new Discord.RichEmbed()
        .setTitle("Minecraft server **online**")
        .setDescription(ip + " (v" + body.version + ")")
        .addField("MOTD", body.motd.clean.join("\n"))
        .addField(
          "Players",
          body.players.online + " of " + body.players.max + " online"
        )
        .addField("Player List", body.players.list.join(", "))
        .setThumbnail("https://api.mcsrvstat.us/icon/" + ip);
    } else {
      var embed = new Discord.RichEmbed()
        .setTitle("Minecraft server **offline**")
        .setDescription("😭😭😭")
        .setThumbnail(
          "https://discordapp.com/assets/f7b3f6b926cb31a17d4928d076febab4.svg"
        );
    }
    msg.channel.send(embed);
  });
}

var announcedBirthday = false;
var birthdayTimestamp = 1566946800000;

function checkForBirthday() {
  if (
    new Date().getTime() > birthdayTimestamp &&
    !announcedBirthday &&
    new Date().getTime() < birthdayTimestamp + 30 * 1000
  ) {
    announcedBirthday = true;
    client.guilds
      .get("571615112570601503")
      .channels.get("577879389279223808")
      .send(
        "Hey @everyone :\n\nToday (28th August) is the birthday of <@222344019458392065> .\nWish <@222344019458392065> a happy birthday when he gets online :cake: "
      );
  }
}

setInterval(checkForBirthday, 10000);

client.on("error", err =>
  client.guilds
    .get("584382438688555019")
    .channels.get("593476194209366017")
    .send("<@&590198302918836240> __**Error**__\n" + JSON.stringify(err))
);
client.on("warn", err =>
  client.guilds
    .get("584382438688555019")
    .channels.get("593476194209366017")
    .send("<@&590198302918836240> __**Warn**__\n" + JSON.stringify(err))
);

client.login(process.env.TOKEN);
