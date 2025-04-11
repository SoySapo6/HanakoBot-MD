const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const mascotasFile = "./mascotas.json";

if (!fs.existsSync(mascotasFile)) {
  fs.writeFileSync(mascotasFile, JSON.stringify({usuarios: {}}, null, 2));
}

const handler = async (msg, { conn, args, command }) => {
  const userId = msg.key.participant || msg.key.remoteJid;
  let data = JSON.parse(fs.readFileSync(mascotasFile));

  switch(command) {
    case 'mascotasmenu':
      let menu = `🐾 *MENÚ DE MASCOTAS* 🐾\n\n`;
      menu += `1. *.perrito* - Ver foto de un perrito\n`;
      menu += `2. *.adoptar* - Adopta un perrito\n`;
      menu += `3. *.acariciar* - Acaricia a tu perrito\n`;
      menu += `4. *.alimentar* - Alimenta a tu perrito\n`;
      menu += `5. *.perritos* - Ver lista de perritos\n`;
      menu += `6. *.pasear* - Lleva a pasear a tu perrito\n`;
      menu += `7. *.entrenar* - Entrena a tu perrito\n`;
      menu += `8. *.jugar* - Juega con tu perrito\n`;
      menu += `9. *.veterinario* - Lleva a tu perrito al veterinario\n`;
      menu += `10. *.competir* - Compite con otros perritos\n`;
      menu += `11. *.estadoperrito* - Ver estado de tu perrito\n`;
      menu += `12. *.regalarhueso* - Regala un hueso a otro perrito\n`;

      await conn.sendMessage(msg.key.remoteJid, { text: menu });
      break;

    case 'perrito':
      try {
        const imagenes = [
          'https://i.postimg.cc/FHyQjzY4/4-sin-t-tulo-20250331223051.png',
          'https://i.postimg.cc/02pHCdMH/4-sin-t-tulo-20250401101351.png', 
          'https://i.postimg.cc/8z4K2pbR/4-sin-t-tulo-20250401101441.png',
          'https://i.postimg.cc/mrrXRvd0/4-sin-t-tulo-20250401101845.png',
          'https://i.postimg.cc/hvVMpcj7/4-sin-t-tulo-20250401102528.png'
        ];
        const imagenAleatoria = imagenes[Math.floor(Math.random() * imagenes.length)];
        await conn.sendMessage(msg.key.remoteJid, {
          image: { url: imagenAleatoria },
          caption: '🐕 *¡Guau guau! Aquí tienes un lindo perrito!*\n\n🦴 Usa `.adoptar` para tener tu propio perrito.'
        });
      } catch (e) {
        console.error(e);
        await conn.sendMessage(msg.key.remoteJid, { text: '❌ Error al obtener la imagen del perrito.' });
      }
      break;

    case 'adoptar':
      if (data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, { 
          text: '❌ *¡Ya tienes un perrito! Dale mucho amor.*' 
        });
      }

      const nombres = ['Max', 'Luna', 'Rocky', 'Bella', 'Thor', 'Coco', 'Lola', 'Zeus', 'Nina', 'Toby'];
      const razas = ['Labrador', 'Husky', 'Pastor Alemán', 'Golden', 'Beagle', 'Bulldog', 'Poodle', 'Chihuahua'];

      const perrito = {
        nombre: nombres[Math.floor(Math.random() * nombres.length)],
        raza: razas[Math.floor(Math.random() * razas.length)],
        felicidad: 100,
        hambre: 0,
        energia: 100,
        salud: 100,
        experiencia: 0,
        nivel: 1,
        adoptadoEl: new Date().toISOString()
      };

      data.usuarios[userId] = { perrito };
      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      await conn.sendMessage(msg.key.remoteJid, {
        text: `🎉 *¡Felicidades! Has adoptado un perrito*\n\n🐕 *Nombre:* ${perrito.nombre}\n🦮 *Raza:* ${perrito.raza}\n\n💝 Cuídalo mucho y dale amor usando los comandos del *.mascotasmenu*`
      });
      break;

    case 'acariciar':
      if (!data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *¡No tienes un perrito! Usa \`.adoptar\` para tener uno.*`
        });
      }

      const perritoAcariciar = data.usuarios[userId].perrito;
      perritoAcariciar.felicidad = Math.min(100, perritoAcariciar.felicidad + 10);
      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      const reacciones = ['*woof woof* 🐾', '*guau guau* ❤️', '*lame tu cara* 💝', '*mueve la colita* 🦴'];
      await conn.sendMessage(msg.key.remoteJid, {
        text: `🐕 *${perritoAcariciar.nombre}* ${reacciones[Math.floor(Math.random() * reacciones.length)]}\n\n😊 *Felicidad:* ${perritoAcariciar.felicidad}%`
      });
      break;

    case 'alimentar':
      if (!data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *¡No tienes un perrito! Usa \`.adoptar\` para tener uno.*`
        });
      }

      const perritoAlimentar = data.usuarios[userId].perrito;
      perritoAlimentar.hambre = Math.max(0, perritoAlimentar.hambre - 20);
      perritoAlimentar.salud = Math.min(100, perritoAlimentar.salud + 5);
      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      const comidas = ['🦴 un hueso', '🥩 carne', '🥫 croquetas', '🍗 pollo', '🥪 galletas'];
      const comida = comidas[Math.floor(Math.random() * comidas.length)];

      await conn.sendMessage(msg.key.remoteJid, {
        text: `🐕 *${perritoAlimentar.nombre}* come ${comida} felizmente\n\n🍖 *Hambre:* ${perritoAlimentar.hambre}%\n❤️ *Salud:* ${perritoAlimentar.salud}%\n💝 *Felicidad:* ${perritoAlimentar.felicidad}%`
      });
      break;

    case 'pasear':
      if (!data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *¡No tienes un perrito! Usa \`.adoptar\` para tener uno.*`
        });
      }

      const perritoPasear = data.usuarios[userId].perrito;
      if (perritoPasear.energia < 30) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `😴 *${perritoPasear.nombre} está muy cansado para pasear.*\n\n💤 Déjalo descansar un poco.`
        });
      }

      perritoPasear.energia = Math.max(0, perritoPasear.energia - 20);
      perritoPasear.felicidad = Math.min(100, perritoPasear.felicidad + 15);
      perritoPasear.experiencia += 10;
      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      await conn.sendMessage(msg.key.remoteJid, {
        text: `🦮 *${perritoPasear.nombre} disfruta del paseo!*\n\n⚡ *Energía:* ${perritoPasear.energia}%\n😊 *Felicidad:* ${perritoPasear.felicidad}%\n📈 *Experiencia:* ${perritoPasear.experiencia} pts`
      });
      break;

    case 'entrenar':
      if (!data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *¡No tienes un perrito! Usa \`.adoptar\` para tener uno.*`
        });
      }

      const perritoEntrenar = data.usuarios[userId].perrito;
      if (perritoEntrenar.energia < 50) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `😴 *${perritoEntrenar.nombre} está muy cansado para entrenar.*\n\n💤 Déjalo descansar un poco.`
        });
      }

      perritoEntrenar.energia = Math.max(0, perritoEntrenar.energia - 30);
      perritoEntrenar.experiencia += 20;

      if (perritoEntrenar.experiencia >= 100) {
        perritoEntrenar.nivel += 1;
        perritoEntrenar.experiencia = 0;
        await conn.sendMessage(msg.key.remoteJid, {
          text: `🎉 *¡${perritoEntrenar.nombre} ha subido al nivel ${perritoEntrenar.nivel}!*`
        });
      }

      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      await conn.sendMessage(msg.key.remoteJid, {
        text: `🏋️ *${perritoEntrenar.nombre} ha completado su entrenamiento!*\n\n⚡ *Energía:* ${perritoEntrenar.energia}%\n📈 *Experiencia:* ${perritoEntrenar.experiencia}/100\n🎖️ *Nivel:* ${perritoEntrenar.nivel}`
      });
      break;

    case 'jugar':
      if (!data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *¡No tienes un perrito! Usa \`.adoptar\` para tener uno.*`
        });
      }

      const perritoJugar = data.usuarios[userId].perrito;
      const juegos = ['🎾 pelota', '🪃 frisbee', '🧸 peluche', '🪵 palo', '🎯 búsqueda del tesoro'];
      const juego = juegos[Math.floor(Math.random() * juegos.length)];

      perritoJugar.energia = Math.max(0, perritoJugar.energia - 15);
      perritoJugar.felicidad = Math.min(100, perritoJugar.felicidad + 20);
      perritoJugar.experiencia += 5;
      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      await conn.sendMessage(msg.key.remoteJid, {
        text: `🎮 *${perritoJugar.nombre} juega con ${juego}*\n\n⚡ *Energía:* ${perritoJugar.energia}%\n😊 *Felicidad:* ${perritoJugar.felicidad}%\n📈 *Experiencia:* ${perritoJugar.experiencia} pts`
      });
      break;

    case 'veterinario':
      if (!data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *¡No tienes un perrito! Usa \`.adoptar\` para tener uno.*`
        });
      }

      const perritoVet = data.usuarios[userId].perrito;
      perritoVet.salud = 100;
      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      await conn.sendMessage(msg.key.remoteJid, {
        text: `👨‍⚕️ *El veterinario ha atendido a ${perritoVet.nombre}*\n\n❤️ *Salud:* ${perritoVet.salud}%\n\n¡Tu perrito está perfectamente sano! 🏥`
      });
      break;

    case 'competir':
      if (!data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *¡No tienes un perrito! Usa \`.adoptar\` para tener uno.*`
        });
      }

      const perritoCompetir = data.usuarios[userId].perrito;
      const competencias = ['carrera', 'salto', 'agilidad', 'obediencia', 'trucos'];
      const competencia = competencias[Math.floor(Math.random() * competencias.length)];
      const puntaje = Math.floor(Math.random() * 100) + (perritoCompetir.nivel * 5);

      perritoCompetir.energia = Math.max(0, perritoCompetir.energia - 40);
      perritoCompetir.experiencia += 30;
      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      await conn.sendMessage(msg.key.remoteJid, {
        text: `🏆 *${perritoCompetir.nombre} participó en la competencia de ${competencia}*\n\n📊 *Puntaje:* ${puntaje} pts\n⚡ *Energía:* ${perritoCompetir.energia}%\n📈 *Experiencia ganada:* 30 pts`
      });
      break;

    case 'estadoperrito':
      if (!data.usuarios[userId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *¡No tienes un perrito! Usa \`.adoptar\` para tener uno.*`
        });
      }

      const perritoEstado = data.usuarios[userId].perrito;
      await conn.sendMessage(msg.key.remoteJid, {
        text: `📊 *Estado de ${perritoEstado.nombre}*\n\n🦮 *Raza:* ${perritoEstado.raza}\n❤️ *Salud:* ${perritoEstado.salud}%\n😊 *Felicidad:* ${perritoEstado.felicidad}%\n🍖 *Hambre:* ${perritoEstado.hambre}%\n⚡ *Energía:* ${perritoEstado.energia}%\n📈 *Experiencia:* ${perritoEstado.experiencia}/100\n🎖️ *Nivel:* ${perritoEstado.nivel}`
      });
      break;

    case 'regalarhueso':
      if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *Menciona al usuario al que quieres regalarle un hueso.*\n\nEjemplo: .regalarhueso @usuario`
        });
      }

      const targetId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];

      if (!data.usuarios[targetId]?.perrito) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: `❌ *El usuario mencionado no tiene un perrito.*`
        });
      }

      const perritoRegalar = data.usuarios[targetId].perrito;
      perritoRegalar.felicidad = Math.min(100, perritoRegalar.felicidad + 10);
      fs.writeFileSync(mascotasFile, JSON.stringify(data, null, 2));

      await conn.sendMessage(msg.key.remoteJid, {
        text: `🦴 *¡Has regalado un hueso al perrito ${perritoRegalar.nombre}!*\n\n😊 *Felicidad actual:* ${perritoRegalar.felicidad}%`,
        mentions: [targetId]
      });
      break;

    case 'perritos':
      const usuarios = Object.entries(data.usuarios);
      if (usuarios.length === 0) {
        return await conn.sendMessage(msg.key.remoteJid, {
          text: '❌ *No hay perritos adoptados aún.*'
        });
      }

      let mensaje = '🐕 *Lista de Perritos Adoptados* 🐕\n\n';
      usuarios.forEach(([id, datos]) => {
        const perrito = datos.perrito;
        mensaje += `🦮 *Dueño:* @${id.split('@')[0]}\n`;
        mensaje += `• *Nombre:* ${perrito.nombre}\n`;
        mensaje += `• *Raza:* ${perrito.raza}\n`;
        mensaje += `• *Nivel:* ${perrito.nivel}\n`;
        mensaje += `• *Felicidad:* ${perrito.felicidad}%\n`;
        mensaje += `• *Salud:* ${perrito.salud}%\n\n`;
      });

      await conn.sendMessage(msg.key.remoteJid, {
        text: mensaje,
        mentions: usuarios.map(([id]) => id)
      });
      break;
  }
};

handler.command = ['mascotasmenu', 'perrito', 'adoptar', 'acariciar', 'alimentar', 'pasear', 'entrenar', 'jugar', 'veterinario', 'competir', 'estadoperrito', 'regalarhueso', 'perritos'];
module.exports = handler;