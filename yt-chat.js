const { google } = require("googleapis");

module.exports = async function (client) {
  const ytKey = process.env.YOUTUBE_API_KEY;
  const ytChannelId = process.env.YOUTUBE_CHANNEL_ID;
  const chatChannelId = process.env.DISCORD_CHAT_CHANNEL_ID;

  if (!ytKey || !ytChannelId) {
    console.log("❌ YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID missing in .env");
    return;
  }

  console.log("📡 Checking YouTube live chat...");

  const youtube = google.youtube({ version: "v3", auth: ytKey });

  try {
    const res = await youtube.search.list({
      part: "id",
      channelId: ytChannelId,
      eventType: "live",
      type: "video"
    });

    if (!res.data.items.length) {
      console.log("❌ No live stream found on YouTube");
      return;
    }

    const liveVideoId = res.data.items[0].id.videoId;
    const liveChatRes = await youtube.videos.list({
      part: "liveStreamingDetails",
      id: liveVideoId
    });

    const liveChatId = liveChatRes.data.items[0].liveStreamingDetails.activeLiveChatId;

    async function pollChat() {
      try {
        const chat = await youtube.liveChatMessages.list({
          liveChatId,
          part: "snippet,authorDetails"
        });

        chat.data.items.forEach((msg) => {
          const text = msg.snippet.displayMessage;
          const author = msg.authorDetails.displayName;

          const channel = client.channels.cache.get(chatChannelId);
          if (channel) {
            channel.send(`💬 [YouTube] ${author}: ${text}`);
          }
        });
      } catch (e) {
        console.log("⚠️ YouTube chat error:", e.message);
      }

      setTimeout(pollChat, 5000);
    }

    pollChat();
  } catch (e) {
    console.log("❌ Error starting YouTube chat:", e.message);
  }
};