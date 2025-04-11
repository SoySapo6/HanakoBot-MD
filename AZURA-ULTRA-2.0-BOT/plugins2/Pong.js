const handler = async (msg, { conn }) => {
  const start = Date.now();

  const respuesta = await conn.sendMessage(msg.key.remoteJid, {
    text: "🏓 *Ping chucha ya este subots anda activo pa culiar🍑 con una culana traime a tu mamá o hermana perro🐕!*"
  }, { quoted: msg });

  const end = Date.now();
  const ping = end - start;

  await conn.sendMessage(msg.key.remoteJid, {
    text: `✅ *Ping:* ${ping} ms`,
    quoted: respuesta
  });
};

handler.command = ['pong'];
module.exports = handler;
