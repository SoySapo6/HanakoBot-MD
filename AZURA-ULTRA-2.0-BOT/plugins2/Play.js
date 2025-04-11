const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

const handler = async (msg, { conn, text, usedPrefix }) => {
  if (!text) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: `✳️ Usa el comando correctamente:\n\n📌 Ejemplo: *${usedPrefix}play* Machine Girl Hysteria`
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: '⏳', key: msg.key }
  });

  try {
    const search = await yts(text);
    const video = search.videos[0];
    if (!video) throw new Error('No se encontraron resultados');

    const videoUrl = video.url;
    const apiURL = `https://api.lolhuman.xyz/api/ytaudio2?apikey=6ce04afb2b5577b3aa412c88&url=${encodeURIComponent(videoUrl)}`;

    const infoMessage = `
╔══════════════════╗
║  ✦ HanakoBot-MD ✦
╚══════════════════╝

📀 *Info del audio:*  
├ 🎼 *Título:* ${video.title}
├ ⏱️ *Duración:* ${video.timestamp}
├ 👁️ *Vistas:* ${video.views.toLocaleString()}
├ 👤 *Autor:* ${video.author.name}
└ 🔗 *Enlace:* ${videoUrl}

📥 *Opciones:*  
┣ 🎵 _${usedPrefix}play1 ${text}_
┣ 🎥 _${usedPrefix}play2 ${text}_
┣ 🎥 _${usedPrefix}play6 ${text}_
┗ ⚠️ *¿No se reproduce?* Usa _${usedPrefix}ff_

⏳ Procesando audio...
═══════════════════`;

    await conn.sendMessage(msg.key.remoteJid, {
      image: { url: video.thumbnail },
      caption: infoMessage
    }, { quoted: msg });

    const res = await axios.get(apiURL);
    if (!res.data.status || res.data.status !== 200) throw new Error("No se pudo obtener el audio");

    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const rawPath = path.join(tmpDir, `${Date.now()}_raw.m4a`);
    const finalPath = path.join(tmpDir, `${Date.now()}_final.mp3`);

    const audioRes = await axios.get(res.data.result.link, { responseType: 'stream' });
    await streamPipeline(audioRes.data, fs.createWriteStream(rawPath));

    await new Promise((resolve, reject) => {
      ffmpeg(rawPath)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .format('mp3')
        .save(finalPath)
        .on('end', resolve)
        .on('error', reject);
    });

    await conn.sendMessage(msg.key.remoteJid, {
      audio: fs.readFileSync(finalPath),
      mimetype: 'audio/mpeg',
      fileName: `${video.title}.mp3`,
      ptt: false
    }, { quoted: msg });

    fs.unlinkSync(rawPath);
    fs.unlinkSync(finalPath);

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

handler.command = ['play'];
module.exports = handler;