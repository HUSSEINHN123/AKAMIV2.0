const axios = require("axios");
const { createReadStream, createWriteStream, unlinkSync, statSync } = require("fs-extra");

module.exports.config = {
  name: "يوتيب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "CatalizCS mod video by Đăng",
  description: "تشغيل فيديوهات من اليوتيوب",
  commandCategory: "قــســم الــادوات",
  usages: "يوتيب [إسم الفيديو]",
  cooldowns: 10
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  try {
    const selectedVideo = handleReply.searchResults[event.body - 1];
    const videoUrl = `https://www.youtube.com/watch?v=${selectedVideo.id.videoId}`;
    const title = selectedVideo.snippet.title;

    api.sendMessage(`⏱️ | جاري تنزيل الفيديو: ${title}\nهذا قد يستغرق بعض الوقت، يرجى الانتظار.`, event.threadID, async (err, info) => {
      setTimeout(() => api.unsendMessage(info.messageID), 20000);
    });

    // استخدام رابط التحميل الجديد
    const response = await axios.get(`https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(videoUrl)}`);
    
    // التحقق من بنية البيانات الجديدة
    if (!response.data.status || !response.data.data) {
      throw new Error("لم يتم العثور على رابط تحميل في الاستجابة من الخادم الجديد");
    }
    
    // استخدام الرابط من البنية الجديدة
    const downloadLink = response.data.data.video || response.data.data.video_hd;

    if (!downloadLink) {
      throw new Error("لم يتم العثور على رابط فيديو للتحميل");
    }

    const filePath = `${__dirname}/cache/video_${Date.now()}.mp4`;

    // تنزيل الفيديو باستخدام الرابط المباشر
    const videoStream = await axios({
      url: downloadLink,
      method: "GET",
      responseType: "stream",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    videoStream.data
      .pipe(createWriteStream(filePath))
      .on("close", () => {
        if (statSync(filePath).size > 26214400) {
          api.sendMessage("⚠️ | تعذر إرسال الفيديو لأن حجمه أكبر من 25 ميغابايت.", event.threadID, () => unlinkSync(filePath));
        } else {
          api.sendMessage({ 
            body: `✅ | تم التحميل بنجاح\n\nالعنوان: ${title}`,
            attachment: createReadStream(filePath) 
          }, event.threadID, () => unlinkSync(filePath));
        }
      })
      .on("error", (error) => {
        api.sendMessage(`⛔ | حدث خطأ أثناء التنزيل: ${error.message}`, event.threadID);
        if (require("fs-extra").existsSync(filePath)) {
          unlinkSync(filePath);
        }
      });
  } catch (error) {
    console.error(error);
    api.sendMessage(`⛔ | تعذر معالجة طلبك! الخطأ: ${error.message}`, event.threadID);
  }
};

module.exports.run = async function({ api, event, args }) {
  if (args.length === 0) return api.sendMessage("⚠️ | لا يمكن ترك البحث فارغًا!", event.threadID, event.messageID);

  const query = args.join(" ");
  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=AIzaSyC_CVzKGFtLAqxNdAZ_EyLbL0VRGJ-FaMU&type=video&maxResults=6`;

  try {
    const response = await axios.get(apiUrl);
    const searchResults = response.data.items;

    if (!searchResults.length) {
      return api.sendMessage("❌ | لم يتم العثور على نتائج.", event.threadID, event.messageID);
    }

    let message = "🎼 نتائج البحث:\n\n";
    const attachments = [];
    
    searchResults.forEach((result, index) => {
      message += `${index + 1}. ${result.snippet.title}\nالقناة: ${result.snippet.channelTitle}\n-----------------------\n`;
      attachments.push(
        axios.get(result.snippet.thumbnails.medium.url, { 
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })
          .then(response => ({
            path: `${__dirname}/cache/thumb_${index + 1}.jpg`,
            buffer: Buffer.from(response.data)
          }))
          .catch(() => ({
            path: `${__dirname}/cache/thumb_${index + 1}.jpg`,
            buffer: null
          }))
      );
    });

    const attachmentFiles = await Promise.all(attachments);
    
    // إنشاء الصور المصغرة فقط إذا كانت البيانات متاحة
    const validAttachments = [];
    attachmentFiles.forEach((file, index) => {
      if (file.buffer) {
        require("fs-extra").writeFileSync(file.path, file.buffer);
        validAttachments.push(file);
      }
    });

    api.sendMessage(
      {
        body: `${message}\nأرجوك قم بالرد على هذه الرسالة برقم الفيديو (1-${searchResults.length}) لتنزيله.`,
        attachment: validAttachments.map(file => createReadStream(file.path))
      },
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          searchResults
        });
        // حذف الملفات المؤقتة بعد الإرسال
        validAttachments.forEach(file => {
          if (require("fs-extra").existsSync(file.path)) {
            unlinkSync(file.path);
          }
        });
      },
      event.messageID
    );
  } catch (error) {
    console.error(error);
    api.sendMessage(`⛔ | حدث خطأ أثناء البحث: ${error.message}`, event.threadID, event.messageID);
  }
};
