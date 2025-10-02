require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const aparatChat = require("./aparat-chat");
const ytChat = require("./yt-chat");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  aparatChat(client);
  ytChat(client);
});

client.login(process.env.DISCORD_TOKEN);