const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { pipeline } = require('stream');
const streamPipeline = promisify(pipeline);

const handler = async (msg, { conn, text, usedPrefix }) => {
  if (!text) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: `✳️ Usa el comando correctamente:\n\n📌 Ejemplo: *${usedPrefix}play2* La Factoría - Perdoname`
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: '⏳', key: msg.key }
  });

  try {
    const yts = require('yt-search');
    const search = await yts(text);
    if (!search.videos || search.videos.length === 0) {
      throw new Error('No se encontraron resultados');
    }

    const video = search.videos[0];
    const videoUrl = video.url;

    const apiURL = `https://api.lolhuman.xyz/api/ytaudio2?apikey=6ce04afb2b5577b3aa412c88&url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(apiURL);

    if (!res.data.status || res.data.status !== 200) {
      throw new Error('No se pudo obtener el video');
    }

    const captionPreview = `
╔═════════════════╗
║✦ HanakoBot-MD ✦║
╚═════════════════╝

📀 *Info del video:*  
├ 🎼 *Título:* ${video.title}
├ ⏱️ *Duración:* ${video.timestamp}
├ 👁️ *Vistas:* ${video.views.toLocaleString()}
├ 👤 *Autor:* ${video.author.name}
└ 🔗 *Link:* ${videoUrl}

📥 *Opciones:*  
┣ 🎵 _${usedPrefix}play1 ${text}_
┣ 🎥 _${usedPrefix}play6 ${text}_
┗ ⚠️ *¿No se reproduce?* Usa _${usedPrefix}ff_

⏳ Procesando video...
═════════════════════`;

    await conn.sendMessage(msg.key.remoteJid, {
      image: { url: video.thumbnail },
      caption: captionPreview
    }, { quoted: msg });

    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const filePath = path.join(tmpDir, `${Date.now()}_video.mp4`);

    const videoRes = await axios.get(res.data.result.link, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    await streamPipeline(videoRes.data, fs.createWriteStream(filePath));

    const stats = fs.statSync(filePath);
    if (!stats || stats.size < 100000) {
      fs.unlinkSync(filePath);
      throw new Error('El video descargado está vacío o incompleto');
    }

    await conn.sendMessage(msg.key.remoteJid, {
      video: fs.readFileSync(filePath),
      mimetype: 'video/mp4',
      fileName: `${video.title}.mp4`,
      caption: `🎬 Aquí tiene su video.\n\n© HanakoBot-MD`
    }, { quoted: msg });

    fs.unlinkSync(filePath);

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: `❌ *Error:* ${err.message}`
    }, { quoted: msg });
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '❌', key: msg.key }
    });
  }
};

handler.command = ['play2'];
module.exports = handler;