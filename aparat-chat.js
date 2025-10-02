const { io } = require("socket.io-client");

module.exports = function (client) {
  const wsUrl = process.env.APARAT_WS_URL;
  const chatChannelId = process.env.DISCORD_CHAT_CHANNEL_ID;

  if (!wsUrl) return console.log("❌ APARAT_WS_URL not set in .env");

  console.log("📡 Connecting to Aparat chat...");

  const socket = io(wsUrl, {
    transports: ["websocket"]
  });

  socket.on("connect", () => {
    console.log("✅ Connected to Aparat chat");
  });

  socket.on("message", (msg) => {
    console.log("📥 Aparat:", msg);

    const channel = client.channels.cache.get(chatChannelId);
    if (channel) {
      channel.send(`💬 [Aparat] ${msg.user}: ${msg.text}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("⚠️ Disconnected from Aparat chat");
  });
};