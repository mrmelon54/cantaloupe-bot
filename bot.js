require("dotenv").config();
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
var mathjs = {
  create: require("mathjs").create,
  all: require("mathjs").all,
  simplify: require("mathjs").simplify,
  format: require("mathjs").format,
};
const math = mathjs.create(mathjs.all);
const { exec } = require("child_process");
const ytdl = require("ytdl-core");
const validUrl = require("valid-url");
const request = require("request");
const got = require("got");
const escapeStringRegexp = require("escape-string-regexp");

function fancyDownloadCountText(v) {
  if (v >= 1000000) return `${Math.round(v / 100) / 10000000}B`;
  if (v >= 1000000) return `${Math.round(v / 100) / 10000}M`;
  if (v >= 1000) return `${Math.round(v / 100) / 10}k`;
  return v;
}

function mathjsNoImport() {
  throw new Error("function import is disabled.");
}
math.import({ import: mathjsNoImport }, { override: true });

function mathjsevaluate(expr) {
  var ans = math.evaluate(expr);
  return mathjs.format(ans);
}

function mathjssimplify(expr) {
  console.log("Doing math: " + expr.toString());
  var ans = mathjs.simplify(expr);
  console.log(ans);
  return ans.toString();
}

const streamOptions = { seek: 0, volume: 1 };

// disable by default so people breaking it can't use it again afterwards
var youtubeenabled = true;
var uservc = {};
// { channel: <lastchannelid>, time: <lasttimeinchannel>, type:0 }

client.on("voiceStateUpdate", (oldMember, newMember) => {
  client.users
    .fetch(oldMember.id)
    .then((user) => {
      // ignore bot cuz they don't matter
      if (user.bot) return false;

      // only listen for channel hopping in the owner's server
      let b = 0;
      if (oldMember.guild != null) b += oldMember.guild.id == config.AboutMe.ownerServer;
      if (newMember.guild != null) b += newMember.guild.id == config.AboutMe.ownerServer;
      return b >= 1;
    })
    .then((doMagic) => {
      if (doMagic) {
        let oldUserChannel = oldMember.channel;
        let newUserChannel = newMember.channel;

        // in the same channel so ignore the event
        if (oldUserChannel != undefined && newUserChannel != undefined && oldUserChannel.id.toString() == newUserChannel.id.toString()) return;

        if (newUserChannel != undefined) {
          // connected to a channel from anywhere
          if (newUserChannel.id.toString() == config.VoiceChannels.MelonRoom) newMember.member.roles.add(config.VoiceRoles.MelonRoom);
          if (newUserChannel.id.toString() == config.VoiceChannels.AdminRoom) newMember.member.roles.add(config.VoiceRoles.AdminRoom);
          if (newUserChannel.id.toString() == config.VoiceChannels.StaffRoom) newMember.member.roles.add(config.VoiceRoles.StaffRoom);
          else if (newUserChannel.id.toString() == config.VoiceChannels.WaitingRoom) {
            // connected to waiting room
            if (uservc[newMember.id.toString()] != undefined && uservc[newMember.id.toString()].time.getTime() > new Date().getTime() - 600000) {
              switch (uservc[newMember.id.toString()].type) {
                case 1:
                  client.channels.fetch(uservc[newMember.id.toString()].channel).then((c) => {
                    // user needs moving back to a channel
                    speak(newUserChannel, "Moving you back to " + c.name, null, null, () => {
                      delete uservc[newMember.id.toString()];
                      newMember.setChannel(c);
                    });
                  });
                  break;
                case 2:
                  client.channels.fetch(uservc[newMember.id.toString()].channel).then((c) => {
                    // user needs moving back to space
                    var msgs = ["I love space too", "Welcome to space", "Space is fun", "Do you like space?", "Yay space!!", "Space is not a lie", "You love space"];
                    speak(newUserChannel, msgs[Math.floor(Math.random() * msgs.length)], null, null, () => {
                      delete uservc[newMember.id.toString()];
                      newMember.setChannel(c);
                    });
                  });
                  break;
              }
            } else {
              // time has expire and saved channel can be removed
              delete uservc[newMember.id.toString()];
              speak(newUserChannel, "Welcome to the waiting room");
            }
          }
        }
        if (oldUserChannel != undefined) {
          // disconnected from channel
          if (newUserChannel == undefined || newUserChannel.id.toString() != config.VoiceChannels.MelonRoom) oldMember.member.roles.remove(config.VoiceRoles.MelonRoom).catch((reason) => console.error("Unable to remove MelonVC role: " + reason));
          if (newUserChannel == undefined || newUserChannel.id.toString() != config.VoiceChannels.AdminRoom) oldMember.member.roles.remove(config.VoiceRoles.AdminRoom).catch((reason) => console.error("Unable to remove AdminVC role: " + reason));
          if (newUserChannel == undefined || newUserChannel.id.toString() != config.VoiceChannels.StaffRoom) oldMember.member.roles.remove(config.VoiceRoles.StaffRoom).catch((reason) => console.error("Unable to remove StaffVC role: " + reason));
          if (newUserChannel == undefined) {
            // disconnected from all voice channels
            // prevent setting waiting room as last channel
            if (oldUserChannel.id.toString() != config.VoiceChannels.WaitingRoom)
              uservc[oldMember.id.toString()] = {
                channel: oldUserChannel.id.toString(),
                time: new Date(),
                type: 1,
              };
          }
        }
      }
    });
});

client.on("guildMemberUpdate", (o, n) => {
  updateMemberNickname(n);
});

function updateMemberNickname(n) {
  // I think I just removed symbols from nicknames
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Update the status every 10 minutes
  client.setInterval(() => {
    updateStatus();
  }, 10 * 60 * 1000);

  setInterval(checkForBirthday, 10000);

  updateStatus();

  client.channels
    .fetch(config.Verify.channel)
    .then((channel) => {
      channel.messages
        .fetch(config.Verify.message)
        .then((d) => {
          d.react("🍉")
            .then(() => {})
            .catch(() => {});
        })
        .catch(() => {
          console.error("Can't find verify message");
        });
    })
    .catch(() => {
      console.error("Can't find verify channel");
    });
  for (let i = 0; i < config.ReactionRoles.length; i++) {
    client.channels
      .fetch(config.ReactionRoles[i].channel)
      .then((channel) => {
        channel.messages
          .fetch(config.ReactionRoles[i].message)
          .then((d) => {
            var o = Object.keys(config.ReactionRoles[i].reactions);
            for (let j = 0; j < o.length; j++)
              d.react(o[j])
                .then(() => {})
                .catch(() => {
                  console.error("Can't react with " + o[j]);
                });
          })
          .catch(() => {
            console.error("Can't find reaction roles message " + config.ReactionRoles[i].message);
          });
      })
      .catch(() => {
        console.error("Can't find reaction roles channel " + config.ReactionRoles[i].channel);
      });
  }
  var g = client.guilds.resolve(config.rolesymbolsserver);
  if (g == undefined) return;
  g.members.fetch().then((x) => {
    x.forEach((y) => updateMemberNickname(y));
  });
});

client.on("messageReactionAdd", (r, u) => {
  if (u.bot) return;
  if (r.message.id.toString() === config.Verify.message && r.emoji.toString() == "🍉") {
    r.message.channel.guild
      .fetch()
      .then((guild) => {
        guild.members
          .fetch(u.id.toString())
          .then((member) => {
            member.roles
              .add(config.Verify.role)
              .then(() => {
                member
                  .createDM()
                  .then((dm) => {
                    dm.send(`You joined ${member.guild.name}`);
                  })
                  .catch(() => {});
              })
              .catch(() => {
                member
                  .createDM()
                  .then((dm) => {
                    dm.send(`I was unable to verify your account`);
                  })
                  .catch(() => {});
              });
          })
          .catch(() => {
            console.error("VMRA: Can't fetch member");
          });
      })
      .catch(() => {
        console.error("VMRA: Can't fetch guild");
      });
  } else {
    var f = config.ReactionRoles.filter((x) => x.message == r.message.id.toString());
    if (f.length == 1) {
      if (f[0].reactions.hasOwnProperty(r.emoji.id.toString())) {
        r.message.channel.guild
          .fetch()
          .then((guild) => {
            guild.members
              .fetch(u.id.toString())
              .then((member) => {
                member.roles
                  .add(f[0].reactions[r.emoji.id.toString()])
                  .then(() => {})
                  .catch(() => {});
              })
              .catch(() => {
                console.error("MRA: Can't fetch member");
              });
          })
          .catch(() => {
            console.error("MRA: Can't fetch guild");
          });
      }
    }
  }
});

client.on("messageReactionRemove", (r, u) => {
  var f = config.ReactionRoles.filter((x) => x.message == r.message.id.toString());
  if (f.length == 1) {
    if (f[0].reactions.hasOwnProperty(r.emoji.id.toString())) {
      r.message.guild
        .fetch()
        .then((guild) => {
          guild.members
            .fetch(u.id.toString())
            .then((member) => {
              member.roles
                .remove(f[0].reactions[r.emoji.id.toString()])
                .then(() => {})
                .catch(() => {});
            })
            .catch(() => {
              console.error("MRR: Can't fetch member");
            });
        })
        .catch(() => {
          console.error("MRR: Can't fetch guild");
        });
    }
  }
});

function commandParser(_a) {
  var _o = {
    result: false,
    output: [""],
    isCmd: false,
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
    type: config.AboutMe.status.presence.toUpperCase(),
  });
}

client.on("message", async (msg) => {
  if (msg.author.bot) return;
  var cp = commandParser(msg.content);

  if (["~minecraft", "~mc"].includes(msg.content.trim().toLowerCase()) && config.MinecraftServers.hasOwnProperty(msg.guild.id.toString())) {
    getMCServerStatus(config.MinecraftServers[msg.guild.id.toString()], msg);
    return;
  }
  if (["~space"].includes(msg.content.trim().toLowerCase())) {
    if (msg.guild == null) {
      if (config["space!!!"].users.includes(msg.author.id.replace(new RegExp("^" + escapeStringRegexp(config.AboutMe.ownerId) + "$"), "%owner%"))) {
        uservc[msg.author.id] = {
          channel: config["space!!!"].channel,
          time: new Date(),
          type: 2,
        };
        msg.channel.send("Join the waiting room in Melon Planet to continue your adventure");
      } else {
        msg.channel.send("No space :sob: ");
      }
    } else {
      msg
        .delete()
        .then(() => {})
        .catch(() => {});
    }
    return;
  }
  if (cp.isCmd) {
    var cmd = cp.output;

    if (cmd[0] == "help" && cmd.length == 1) {
      var e = new Discord.MessageEmbed().setTitle("Overlord Bot Help").setDescription(fs.readFileSync("help.txt").toString());
      msg.channel.send(e);
      return;
    }

    if (cmd[0] == "mute" && cmd.length > 1) {
      if (msg.author.roles.has(moderatorRole)) {
        msg.mentions.each((member) => {
          member.roles
            .remove(member.roles.cache.array().map((x) => x.id))
            .then(() => {})
            .catch(() => {});
          member.roles.add([mutedRole]);
        });
      }
      return;
    }

    if (cmd[0] == "fakemsg" && cmd.length > 3) {
      var username = cmd[1].toString();
      var avatar = "" + cmd[2].toString();
      var mess = cmd.splice(3).join(" ").toString();
      msg.channel
        .createWebhook(username, {
          avatar: avatar,
          reason: "Automated messaging",
        })
        .then((webhook) => {
          webhook
            .send(mess)
            .then(() => {
              webhook
                .delete()
                .then(() => {})
                .catch((x) => console.error("webhook delete error", x));
            })
            .catch((err) => {
              webhook
                .delete()
                .then(() => {})
                .catch((x) => console.error("webhook delete error", x));
              console.error("message send error", err);
            });
        })
        .catch((x) => console.error("webhook create error", x));
      msg.delete();
    }

    if (cmd[0] == "ktaneidea") {
      switch (cmd.length) {
        case 1:
        case 2:
          switch (cmd[1]) {
            case "inprogress":
              getRandomIdea("inProgress").then((a) => {
                msg.channel.send(generateItemInfoEmbed(a));
              });
              break;
            case "notready":
              getRandomIdea("notReady").then((a) => {
                msg.channel.send(generateItemInfoEmbed(a));
              });
              break;
            case "unknown":
              getRandomIdea("unknown").then((a) => {
                msg.channel.send(generateItemInfoEmbed(a));
              });
              break;
            case "ready":
            default:
              getRandomIdea("isReady").then((a) => {
                msg.channel.send(generateItemInfoEmbed(a));
              });
          }
      }
    } else if (msg.content.toLowerCase() == "~egg") {
      msg.channel.send("You think you found it do you well think again");
    } else if (msg.content.toLowerCase() == "~qr") {
      var embed = new Discord.MessageEmbed().setImage("https://cdn.discordapp.com/emojis/610611944772075555.png?v=1");
      msg.channel.send(embed);
    } else if (cmd[0] == "emote" && cmd.length == 2) {
      msg.channel.send(client.emojis.find((x) => x.name.toLowerCase().replace(/_/g, "").replace(/-/g, "") == cmd[1].toLowerCase().replace(/_/g, "").replace(/-/g, "")).toString());
    } else if (cmd[0] == "sudo" && config.AboutMe.ownerId == msg.author.id && cmd.length >= 2) {
      msg.channel.send("Hey idiot just ssh to me");
    } else if (cmd[0] == "math") {
      var expr = cmd.splice(1, cmd.length).join(" ");
      try {
        console.log("Evaluating: " + expr);
        msg.channel.send("Math result: " + mathjsevaluate(expr));
      } catch (e) {
        try {
          console.log("Simplifying: " + expr);
          msg.channel.send("Math result: " + mathjssimplify(expr));
        } catch (e) {
          msg.channel.send("Sorry I need more math classes 😭");
        }
      }
    } else if (msg.content.toLowerCase() == "~revenge") {
      var vc = msg.member.voice.channel;
      try {
        playSong(vc, "NeI-1Aq5CJw");
      } catch (e) {}
    } else if (["yt", "youtube"].includes(cmd[0]) && cmd.length == 2) {
      if (cmd[1] == "enable" && msg.author.id === config.AboutMe.ownerId) {
        youtubeenabled = true;
        msg.channel.send("Enabled youtube feature");
        return;
      }
      if (cmd[1] == "disable" && msg.author.id === config.AboutMe.ownerId) {
        youtubeenabled = false;
        msg.channel.send("Disabled youtube feature");
        return;
      }
      if (youtubeenabled || msg.author.id === config.AboutMe.ownerId) {
        var vc = msg.member.voice.channel;
        try {
          playSong(vc, cmd[1]);
        } catch (e) {}
      } else {
        msg.channel.send("This feature might be disabled");
      }
    } else if (msg.content.toLowerCase() == "~stop") {
      var vc = msg.member.voice.channel;
      vc.leave().catch(() => {});
    } else if (msg.content.toLowerCase() == "~stopall" && config.AboutMe.ownerId == msg.author.id) {
      client.voice.connections.each((b) => b.channel.leave());
    } else if (cmd[0] == "say" && cmd.length > 1 && msg.author.id == config.AboutMe.ownerId) {
      var vc = msg.member.voice.channel;
      speak(vc, cmd.slice(1, cmd.length).join(" "));
    }
  }
});

function playSong(vc, song) {
  vc.join()
    .then((conn) => {
      const stream = ytdl(song, {
        filter: "audioonly",
      });
      const dispatcher = conn.play(stream, streamOptions);
      dispatcher.on("speaking", (end) => {
        if (!end) vc.leave();
      });
    })
    .catch((err) => {
      console.error(err);
      vc.leave().catch(() => {});
    });
}

function speak(vc, text, speed = null, voice = null, callback = null) {
  if (speed == null) speed = 130;
  if (voice == null) voice = "english-us";
  var filename = `${__dirname}/recordings/speech-${new Date().getTime()}.wav`;

  exec(`espeak "${text.replace(/"/g, "")}" -s "${speed.toString().replace(/"/g, "")}" -v "${voice.replace(/"/g, "")}" -w "${filename.replace(/"/g, "")}"`, (err) => {
    if (err) {
      console.log(err);
      return;
    }

    vc.join().then((conn) => {
      const dispatcher = conn.play(filename);
      dispatcher.on("speaking", (end) => {
        if (!end) {
          vc.leave();
          setTimeout(() => {
            fs.unlinkSync(filename);
            if (callback != undefined && callback != null) callback();
          }, 1000);
        }
      });
    });
  });
}

var isGitDownloadRunning = false;

var deleteFolderRecursive = function (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) deleteFolderRecursive(curPath);
      else fs.unlinkSync(curPath);
    });
    fs.rmdirSync(path);
  }
};

function generateItemInfoEmbed(data) {
  var modStates = {
    inProgress: "<:in_progress:585545462640017428>",
    isReady: "<:ready:585545462942138368>",
    notReady: "<:not_ready:585545462602399744>",
    unknown: "<:unknown:585545462644211715>",
  };
  var stateColours = {
    inProgress: 0x00ff00,
    isReady: 0xffff00,
    notReady: 0xff0000,
    unknown: 0x777777,
  };
  var embed = new Discord.MessageEmbed().setTitle(modStates[data.state] + "   " + data.name.toString()).setColor(stateColours[data.state]);
  if (data.manualUrl !== "") {
    if (validUrl.isUri(data.manualUrl)) {
      embed.setURL(data.manualUrl.replace(/ /g, "%20"));
    } else {
      embed.setTitle(modStates[data.state] + "   " + data.name.toString() + " :: (Invalid manual URL)");
    }
  }
  var o = "by " + data.author;
  if (data.description !== "") o += "\n" + data.description;
  if (data.notes !== "") o += "\n(" + data.notes + ")";
  embed.setDescription(o);
  return embed;
}

// min = inclusive
// max = exclusive
function getRandomInt(min, max) {
  return Math.floor(Math.random() * max) + min;
}

function getRandomIdea(t) {
  return new Promise((resolve, reject) => {
    got
      .post("https://ktane.onpointcoding.net/ideas/getmeta.php", {
        responseType: "text",
      })
      .then((res) => {
        var d = res.body;
        var ideas = JSON.parse(d).ideas;
        var modIdea = undefined;
        var filteredIdeas = ideas.filter((a) => a.state === t);
        if (filteredIdeas.length === 0) {
          resolve({
            name: "I couldn't find any ideas",
            description: "It looks like there aren't any",
            manualUrl: "",
            notes: "",
            state: "unknown",
            author: "KTaNE Mod Ideas Bot",
          });
        } else {
          while (modIdea === undefined || modIdea === null) {
            modIdea = filteredIdeas[getRandomInt(0, d.length)];
          }
          resolve(modIdea);
        }
      })
      .catch((err) => {
        console.error("Error getting random idea");
        console.error(err);
        reject();
      });
  });
}

function getMCServerStatus(ip, msg) {
  var url = "https://api.mcsrvstat.us/2/" + ip;
  request(url, function (err, response, body) {
    if (err) {
      return msg.channel.send("Error getting Minecraft server status...");
    }
    body = JSON.parse(body);
    var embed;
    if (body.online) {
      embed = new Discord.MessageEmbed()
        .setTitle("Minecraft server **online**")
        .setDescription(ip + " (v" + body.version + ")")
        .addField("MOTD", body.motd.clean.join("\n"))
        .addField("Players", body.players.online + " of " + body.players.max + " online");
      if (body.players.online > 0) {
        embed.addField("Player List", body.players.list.join(", "));
      }
      embed.setThumbnail("https://api.mcsrvstat.us/icon/" + ip);
    } else {
      embed = new Discord.MessageEmbed().setTitle("Minecraft server **offline**").setDescription("😭😭😭").setThumbnail("https://discordapp.com/assets/f7b3f6b926cb31a17d4928d076febab4.svg");
    }
    msg.channel.send(embed);
  });
}

var announcedBirthday = false;
var birthdayTimestamp = new Date(new Date().getFullYear(), 7, 28, 0, 0, 0).getTime();

function checkForBirthday() {
  if (new Date().getTime() > birthdayTimestamp && !announcedBirthday && new Date().getTime() < birthdayTimestamp + 10 * 60 * 1000) {
    announcedBirthday = true;
    client.channels
      .fetch("577879389279223808")
      .then((c) => {
        c.send("Hey @everyone :\n\nToday (28th August) is the birthday of <@222344019458392065> .\nWish <@222344019458392065> a happy birthday when he gets online :cake: ");
      })
      .catch(console.err);
  }
}

client.on("error", (err) => console.error(err));
client.on("warn", (err) => console.error(err));

client.login(process.env.TOKEN);
