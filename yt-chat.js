const { google } = require("googleapis");

module.exports = async function (client) {
  const ytKey = process.env.YOUTUBE_API_KEY;
  const ytChannelId = process.env.YOUTUBE_CHANNEL_ID;
  const ytVideoId = process.env.YOUTUBE_VIDEO_ID;
  const chatChannelId = process.env.VIEWER_CHANNEL_ID;

  if (!ytKey || (!ytChannelId && !ytVideoId)) {
    console.log("❌ YOUTUBE_API_KEY and either YOUTUBE_CHANNEL_ID or YOUTUBE_VIDEO_ID required in .env");
    return;
  }

  console.log("📡 Checking YouTube live chat...");

  const youtube = google.youtube({ version: "v3", auth: ytKey });

  try {
    let liveVideoId = ytVideoId;

    // اگه VIDEO_ID ست نشده بود، از CHANNEL_ID جستجو می‌کنیم
    if (!liveVideoId && ytChannelId) {
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

      liveVideoId = res.data.items[0].id.videoId;
    }

    // گرفتن liveChatId
    const liveChatRes = await youtube.videos.list({
      part: "liveStreamingDetails",
      id: liveVideoId
    });

    if (!liveChatRes.data.items.length || !liveChatRes.data.items[0].liveStreamingDetails.activeLiveChatId) {
      console.log("❌ This video has no active live chat.");
      return;
    }

    const liveChatId = liveChatRes.data.items[0].liveStreamingDetails.activeLiveChatId;
    console.log(`✅ Found liveChatId: ${liveChatId}`);

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
