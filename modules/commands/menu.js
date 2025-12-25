module.exports.config = {
  name: "اوامر",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "S H A D O W",
  description: "عرض أوامر البوت",
  usages: "[اسم الأمر] أو [رقم الصفحة]",
  commandCategory: "الــــجـــروب",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  // إذا طلب المستخدم معلومات أمر محدد
  if (args[0] && !isNaN(args[0]) == false) {
    const cmdName = args[0].toLowerCase();
    const command = commands.get(cmdName);
    
    if (!command) {
      return api.sendMessage(`❌ الأمر "${cmdName}" غير موجود.`, threadID, messageID);
    }
    
    const config = command.config;
    let msg = `⨳┅━┉━ أوامر البوت ┅━┅━⨳\n\n`;
    msg += `⌯ اسم الأمر: ${cmdName}\n`;
    msg += `⌯ الوصف: ${config.description || "بدون وصف"}\n`;
    msg += `⌯ الاستخدام: ${prefix}${cmdName} ${config.usages || ""}\n`;
    msg += `⌯ الانتظار: ${config.cooldowns || 5} ثانية\n`;
    
    const permText = config.hasPermssion == 0 ? "جميع المستخدمين" :
                     config.hasPermssion == 1 ? "مشرفي المجموعة" : 
                     "مطور البوت فقط";
    msg += `⌯ الصلاحية: ${permText}\n`;
    msg += `⌯ التصنيف: ${config.commandCategory}\n`;
    msg += `\n⨳┅━━┉━┅━┅━⨳`;
    
    return api.sendMessage(msg, threadID, messageID);
  }

  // تجميع الأوامر حسب التصنيف
  const categories = {};
  
  commands.forEach((cmd, name) => {
    const category = cmd.config.commandCategory || "عام";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ name, description: cmd.config.description });
  });

  // عرض الأوامر مع التصنيفات
  let msg = `⌔︙بوت تحت تطوير 👨‍💻\n`;
  msg += `⨳┅━┉━Miko Ai┅━┅━⨳\n\n`;

  // الأوامر العامة
  const generalCmds = categories["عام"] || [];
  if (generalCmds.length > 0) {
    msg += `⨳┅━┉اوامر عامة 👨‍💻━┅━⨳\n`;
    generalCmds.forEach((cmd, index) => {
      msg += `⌯ ${cmd.name} ↢『${cmd.description || "بدون شرح 💠"}』\n`;
    });
    msg += `⨳┅━━┉👨‍💻━┅━┅━⨳\n\n`;
  }

  // أوامر الجروب
  const groupCmds = categories["الــــجـــروب"] || [];
  if (groupCmds.length > 0) {
    msg += `⨳┅━┉اوامر الجروب 👥━┅━⨳\n`;
    groupCmds.forEach((cmd, index) => {
      msg += `⌯ ${cmd.name} ↢『${cmd.description || "بدون شرح 💠"}』\n`;
    });
    msg += `⨳┅━━┉👥━┅━┅━⨳\n\n`;
  }

  // أوامر الوسائط
  const mediaCmds = ["يوتيوب", "تيك", "اغنية", "انستا"].filter(cmd => commands.has(cmd));
  if (mediaCmds.length > 0) {
    msg += `⨳┅━┉اوامر الوسائط 🎵━┅━⨳\n`;
    mediaCmds.forEach(cmdName => {
      const cmd = commands.get(cmdName);
      msg += `⌯ ${cmdName} ↢『${cmd.config.description || "بدون شرح 💠"}』\n`;
    });
    msg += `⨳┅━━┉🎵━┅━┅━⨳\n\n`;
  }

  // أوامر الألعاب
  const gameCmds = ["لعنة-الظلام"].filter(cmd => commands.has(cmd));
  if (gameCmds.length > 0) {
    msg += `⨳┅━┉اوامر الألعاب 🎮━┅━⨳\n`;
    gameCmds.forEach(cmdName => {
      const cmd = commands.get(cmdName);
      msg += `⌯ ${cmdName} ↢『${cmd.config.description || "بدون شرح 💠"}』\n`;
    });
    msg += `⨳┅━━┉🎮━┅━┅━⨳\n\n`;
  }

  // الأوامر الخاصة
  const specialCmds = Array.from(commands.entries())
    .filter(([name, cmd]) => cmd.config.hasPermssion >= 2)
    .map(([name, cmd]) => ({ name, description: cmd.config.description }));
  
  if (specialCmds.length > 0) {
    msg += `⨳┅━┉اوامر خاصة 👨‍💻━┅━⨳\n`;
    specialCmds.forEach((cmd, index) => {
      msg += `⌯ ${cmd.name} ↢『${cmd.description || "مطور البوت فقط"}』\n`;
    });
    msg += `⨳┅━━┉👨‍💻━┅━┅━⨳\n\n`;
  }

  // معلومات إضافية
  msg += `\n📌 لمعرفة معلومات أمر محدد: ${prefix}اوامر [اسم الأمر]\n`;
  msg += `📌 عدد الأوامر المتاحة: ${commands.size}\n\n`;
  msg += `https://www.facebook.com/profile.php?id=61576232405796`;

  return api.sendMessage(msg, threadID, messageID);
};
