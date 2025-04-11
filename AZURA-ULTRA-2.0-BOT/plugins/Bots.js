const handler = async (msg, { conn }) => {
  const fs = require("fs");
  const path = require("path");

  const subbotsFolder = "./subbots";
  const subDirs = fs.existsSync(subbotsFolder)
    ? fs.readdirSync(subbotsFolder).filter(d => fs.existsSync(path.join(subbotsFolder, d, "creds.json")))
    : [];

  if (subDirs.length === 0) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: "⚠️ No hay subbots conectados actualmente.",
      quoted: msg
    });
  }

  const total = subDirs.length;
  const lista = subDirs.map((id, i) => `╭➤ *Subbot ${i + 1}*\n│ Número: @${id.split("@")[0]}\n╰───────────────`).join("\n\n");

  const menu = `╭━〔 *PERROBOT-MD* 〕━⬣\n│  🤖 Subbots Conectados\n│  Total: *${total}*\n╰━━━━━━━━━━━━⬣\n\n${lista}`;

  await conn.sendMessage(msg.key.remoteJid, {
    text: menu,
    mentions: subDirs.map(id => id),
    quoted: msg
  });
};

handler.command = ['bots'];
module.exports = handler;