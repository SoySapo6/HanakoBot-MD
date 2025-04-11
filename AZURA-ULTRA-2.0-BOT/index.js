// Initialize web server
const { app, port } = require('./server');
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Servidor web iniciado en el puerto ${port}`);
});

(async () => {
    const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
    const chalk = require("chalk");
    const figlet = require("figlet");
    const fs = require("fs");
    const readline = require("readline");
    const pino = require("pino");
    const { isOwner, getPrefix, allowedPrefixes } = require("./config");
    const { handleCommand } = require("./main"); 
    // Carga de credenciales y estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState("./sessions");
//lista
function isAllowedUser(sender) {
  const listaFile = "./lista.json";
  if (!fs.existsSync(listaFile)) return false;
  const lista = JSON.parse(fs.readFileSync(listaFile, "utf-8"));
  // Extrae solo los dígitos del número para comparar
  const num = sender.replace(/\D/g, "");
  return lista.includes(num);
}

    //privado y admins

const path = "./activos.json";

// 📂 Cargar configuración de modos desde el archivo JSON
function cargarModos() {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify({ modoPrivado: false, modoAdmins: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(path, "utf-8"));
}

// 📂 Guardar configuración de modos en el archivo JSON
function guardarModos(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

let modos = cargarModos();

    // Configuración de consola
    console.log(chalk.cyan(figlet.textSync("Azura Ultra Bot", { font: "Standard" })));    
    console.log(chalk.green("\n✅ Iniciando conexión...\n"));

    // ✅ Mostrar opciones de conexión bien presentadas
    console.log(chalk.yellow("📡 ¿Cómo deseas conectarte?\n"));
    console.log(chalk.green("  [1] ") + chalk.white("📷 Escanear código QR"));
    console.log(chalk.green("  [2] ") + chalk.white("🔑 Ingresar código de 8 dígitos\n"));

    // Manejo de entrada de usuario
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (text) => new Promise((resolve) => rl.question(text, resolve));

    let method = "1"; // Por defecto: Código QR
    if (!fs.existsSync("./sessions/creds.json")) {
        method = await question(chalk.magenta("📞 Ingresa tu número (Ej: 5491168XXXX) "));

        if (!["1", "2"].includes(method)) {
            console.log(chalk.red("\n❌ Opción inválida. Reinicia el bot y elige 1 o 2."));
            process.exit(1);
        }
    }

    async function startBot() {
        try {
            let { version } = await fetchLatestBaileysVersion();
            const socketSettings = {
                printQRInTerminal: method === "1",
                logger: pino({ level: "silent" }),
                auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
                browser: method === "1" ? ["AzuraBot", "Safari", "1.0.0"] : ["Ubuntu", "Chrome", "20.0.04"],
            };

            const sock = makeWASocket(socketSettings);

            // Si la sesión no existe y se usa el código de 8 dígitos
            if (!fs.existsSync("./sessions/creds.json") && method === "2") {
                let phoneNumber = await question("😎Fino vamos aya😎: ");
                phoneNumber = phoneNumber.replace(/\D/g, "");
                setTimeout(async () => {
                    let code = await sock.requestPairingCode(phoneNumber);
                    console.log(chalk.magenta("🔑 Código de vinculación: ") + chalk.yellow(code.match(/.{1,4}/g).join("-")));
                }, 2000);
            }

            // Función para verificar si un usuario es administrador en un grupo
            async function isAdmin(sock, chatId, sender) {
                try {
                    const groupMetadata = await sock.groupMetadata(chatId);
                    const admins = groupMetadata.participants
                        .filter(p => p.admin)
                        .map(p => p.id);
                    return admins.includes(sender) || isOwner(sender);
                } catch (error) {
                    console.error("Error verificando administrador:", error);
                    return false;
                }
            }

// Listener para detectar cambios en los participantes de un grupo (bienvenida y despedida)
sock.ev.on("group-participants.update", async (update) => {
  try {
    // Solo operar en grupos
    if (!update.id.endsWith("@g.us")) return;

    const fs = require("fs");
    const activosPath = "./activos.json";
    let activos = {};
    if (fs.existsSync(activosPath)) {
      activos = JSON.parse(fs.readFileSync(activosPath, "utf-8"));
    }

    // ***************** LÓGICA ANTIARABE *****************
    // Si la función antiarabe está activada en este grupo...
    if (activos.antiarabe && activos.antiarabe[update.id]) {
      // Lista de prefijos prohibidos (sin el signo +)
      const disallowedPrefixes = ["20", "212", "213", "216", "218", "222", "249", "252", "253", "269", "962", "963", "964", "965", "966", "967", "968", "970", "971", "973", "974"];
      if (update.action === "add") {
        // Obtener metadata del grupo para verificar administradores
        let groupMetadata = {};
        try {
          groupMetadata = await sock.groupMetadata(update.id);
        } catch (err) {
          console.error("Error obteniendo metadata del grupo:", err);
        }
        for (const participant of update.participants) {
          // Extraer el número (la parte antes de "@")
          const phoneNumber = participant.split("@")[0];
          // Comprobar si el número comienza con alguno de los prefijos prohibidos
          const isDisallowed = disallowedPrefixes.some(prefix => phoneNumber.startsWith(prefix));
          if (isDisallowed) {
            // Verificar si el usuario es admin o propietario
            let bypass = false;
            const participantInfo = groupMetadata.participants.find(p => p.id === participant);
            if (participantInfo && (participantInfo.admin === "admin" || participantInfo.admin === "superadmin")) {
              bypass = true;
            }
            if (!bypass && !isOwner(participant)) {
              // Enviar aviso mencionando al usuario
              await sock.sendMessage(update.id, {
                text: `⚠️ @${phoneNumber} tiene un número prohibido y será expulsado.`,
                mentions: [participant]
              });
              // Intentar expulsar al usuario
              try {
                await sock.groupParticipantsUpdate(update.id, [participant], "remove");
              } catch (expulsionError) {
                console.error("Error al expulsar al usuario:", expulsionError);
              }
            }
          }
        }
      }
    }
    // **************** FIN LÓGICA ANTIARABE ****************

    // **************** LÓGICA BIENVENIDA/DESPEDIDA ****************
    // Si la función welcome no está activada en este grupo, salimos
    if (!activos.welcome || !activos.welcome[update.id]) return;

    // Textos integrados para bienvenida y despedida
    const welcomeTexts = [
      "¡Bienvenido(a)! Azura Ultra 2.0 Bot te recibe con los brazos abiertos 🤗✨. ¡Disfruta y comparte!",
      "¡Hola! Azura Ultra 2.0 Bot te abraza con alegría 🎉🤖. ¡Prepárate para grandes aventuras!",
      "¡Saludos! Azura Ultra 2.0 Bot te da la bienvenida para que descubras ideas brillantes 🚀🌟.",
      "¡Bienvenido(a) al grupo! Azura Ultra 2.0 Bot te invita a explorar un mundo de posibilidades 🤩💡.",
      "¡Qué alegría verte! Azura Ultra 2.0 Bot te recibe y te hace sentir en casa 🏠💖.",
      "¡Hola! Gracias por unirte; Azura Ultra 2.0 Bot te saluda con entusiasmo 🎊😊.",
      "¡Bienvenido(a)! Cada nuevo miembro es una chispa de inspiración en Azura Ultra 2.0 Bot 🔥✨.",
      "¡Saludos cordiales! Azura Ultra 2.0 Bot te envía un abrazo virtual 🤗💙.",
      "¡Bienvenido(a)! Únete a la experiencia Azura Ultra 2.0 Bot y comparte grandes ideas 🎉🌈.",
      "¡Hola! Azura Ultra 2.0 Bot te da la bienvenida para vivir experiencias inolvidables 🚀✨!"
    ];
    const farewellTexts = [
      "¡Adiós! Azura Ultra 2.0 Bot te despide con gratitud y te desea éxitos en tus nuevos caminos 👋💫.",
      "Hasta pronto, desde Azura Ultra 2.0 Bot te deseamos lo mejor y esperamos verte de nuevo 🌟🙏.",
      "¡Chao! Azura Ultra 2.0 Bot se despide, pero siempre tendrás un lugar si decides regresar 🤗💔.",
      "Nos despedimos con cariño; gracias por compartir momentos en Azura Ultra 2.0 Bot 🏠❤️.",
      "¡Adiós, amigo(a)! Azura Ultra 2.0 Bot te manda un abrazo y te desea mucha suerte 🤝🌟.",
      "Hasta luego, y gracias por haber sido parte de nuestra comunidad 🚀💙.",
      "Chao, que tus futuros proyectos sean tan brillantes como tú 🌟✨. Azura Ultra 2.0 Bot te recuerda siempre.",
      "¡Nos vemos! Azura Ultra 2.0 Bot te dice adiós con un corazón lleno de gratitud 🤗❤️.",
      "¡Adiós! Que tu camino esté lleno de éxitos, te lo desea Azura Ultra 2.0 Bot 🚀🌟.",
      "Hasta pronto, y gracias por haber compartido momentos inolvidables con Azura Ultra 2.0 Bot 👋💖."
    ];

    // Procesar según la acción: "add" (entrada) o "remove" (salida)
    if (update.action === "add") {
      for (const participant of update.participants) {
        const mention = `@${participant.split("@")[0]}`;
        const mensajeTexto = welcomeTexts[Math.floor(Math.random() * welcomeTexts.length)];
        const option = Math.random();
        if (option < 0.33) {
          // Opción 1: Con foto del usuario (si se puede obtener, sino URL por defecto)
          let profilePicUrl;
          try {
            profilePicUrl = await sock.profilePictureUrl(participant, "image");
          } catch (err) {
            profilePicUrl = "https://cdn.dorratz.com/files/1741323171822.jpg";
          }
          await sock.sendMessage(update.id, {
            image: { url: profilePicUrl },
            caption: `👋 ${mention}\n\n${mensajeTexto}`,
            mentions: [participant]
          });
        } else if (option < 0.66) {
          // Opción 2: Con la descripción del grupo (si está disponible)
          let groupDesc = "";
          try {
            const metadata = await sock.groupMetadata(update.id);
            groupDesc = metadata.desc ? `\n\n📜 *Descripción del grupo:*\n${metadata.desc}` : "";
          } catch (err) {
            groupDesc = "";
          }
          await sock.sendMessage(update.id, {
            text: `👋 ${mention}\n\n${mensajeTexto}${groupDesc}`,
            mentions: [participant]
          });
        } else {
          // Opción 3: Solo texto
          await sock.sendMessage(update.id, {
            text: `👋 ${mention}\n\n${mensajeTexto}`,
            mentions: [participant]
          });
        }
      }
    } else if (update.action === "remove") {
      for (const participant of update.participants) {
        const mention = `@${participant.split("@")[0]}`;
        const mensajeTexto = farewellTexts[Math.floor(Math.random() * farewellTexts.length)];
        const option = Math.random();
        if (option < 0.5) {
          let profilePicUrl;
          try {
            profilePicUrl = await sock.profilePictureUrl(participant, "image");
          } catch (err) {
            profilePicUrl = "https://cdn.dorratz.com/files/1741323171822.jpg";
          }
          await sock.sendMessage(update.id, {
            image: { url: profilePicUrl },
            caption: `👋 ${mention}\n\n${mensajeTexto}`,
            mentions: [participant]
          });
        } else {
          await sock.sendMessage(update.id, {
            text: `👋 ${mention}\n\n${mensajeTexto}`,
            mentions: [participant]
          });
        }
      }
    }
    // **************** FIN LÓGICA BIENVENIDA/DESPEDIDA ****************

  } catch (error) {
    console.error("Error en el evento group-participants.update:", error);
  }
});

            // 🟢 Consola de mensajes entrantes con diseño
sock.ev.on("messages.upsert", async (messageUpsert) => {
  try {
    const msg = messageUpsert.messages[0];
    if (!msg) return;

    const chatId = msg.key.remoteJid; // ID del grupo o usuario
    const isGroup = chatId.endsWith("@g.us"); // Verifica si es un grupo
    const sender = msg.key.participant
      ? msg.key.participant.replace(/[^0-9]/g, "")
      : msg.key.remoteJid.replace(/[^0-9]/g, "");
    const botNumber = sock.user.id.split(":")[0]; // Obtener el número del bot correctamente
    const fromMe = msg.key.fromMe || sender === botNumber; // Verifica si el mensaje es del bot
    let messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    let messageType = Object.keys(msg.message || {})[0]; // Tipo de mensaje (text, image, video, etc.)

    // 🔥 Detectar si el mensaje fue eliminado
    if (msg.message?.protocolMessage?.type === 0) {
      console.log(chalk.red(`🗑️ Un mensaje fue eliminado por ${sender}`));
      return;
    }

    // 🔍 Mostrar en consola el mensaje recibido
    console.log(chalk.yellow(`\n📩 Nuevo mensaje recibido`));
    console.log(chalk.green(`📨 De: ${fromMe ? "[Tú]" : "[Usuario]"} ${chalk.bold(sender)}`));
    console.log(chalk.cyan(`💬 Tipo: ${messageType}`));
    console.log(chalk.cyan(`💬 Mensaje: ${chalk.bold(messageText || "📂 (Mensaje multimedia)")}`));
    console.log(chalk.gray("──────────────────────────"));

    // ********************** LÓGICA ANTILINK **********************
    if (isGroup) {
      // Cargar activos.json y verificar si antilink está activado para este grupo
      const fs = require("fs"); // ya tienes fs, pero no afecta si lo vuelves a requerir
      const pathActivos = "./activos.json";
      let activos = {};
      if (fs.existsSync(pathActivos)) {
        activos = JSON.parse(fs.readFileSync(pathActivos, "utf-8"));
      }
      if (activos.antilink && activos.antilink[chatId]) {
        // Si el mensaje contiene el enlace de WhatsApp
        if (messageText.includes("https://chat.whatsapp.com/")) {
          // Verificar si el remitente es admin o propietario
          let canBypass = false;
          if (isOwner(sender)) {
            canBypass = true;
          }
          // En grupo, obtener metadatos para verificar admin
          try {
            const chatMetadata = await sock.groupMetadata(chatId);
            const participantInfo = chatMetadata.participants.find(p => p.id.includes(sender));
            if (participantInfo && (participantInfo.admin === "admin" || participantInfo.admin === "superadmin")) {
              canBypass = true;
            }
          } catch (err) {
            console.error("Error obteniendo metadata del grupo:", err);
          }
          // Si no es admin ni propietario, proceder a eliminar el mensaje y expulsar al usuario
          if (!canBypass) {
            // Eliminar el mensaje
            await sock.sendMessage(chatId, { delete: msg.key });
            // Enviar mensaje de advertencia con mención
            await sock.sendMessage(chatId, { 
              text: `⚠️ @${sender} ha enviado un enlace no permitido y ha sido expulsado.`, 
              mentions: [msg.key.participant || msg.key.remoteJid]
            });
            // Expulsar al usuario (nota: esta acción requiere permisos y la función groupParticipantsUpdate)
            try {
              await sock.groupParticipantsUpdate(chatId, [msg.key.participant || msg.key.remoteJid], "remove");
            } catch (expulsionError) {
              console.error("Error al expulsar al usuario:", expulsionError);
            }
            return; // Salir de la lógica para que no se procese el mensaje
          }
        }
      }
    }
    // ***************** FIN LÓGICA ANTILINK **********************

    // Lógica para determinar si el bot debe responder:
    if (!isGroup) {
      // En chat privado: solo responde si es fromMe, owner o usuario permitido.
      if (!fromMe && !isOwner(sender) && !isAllowedUser(sender)) return;
    } else {
      // En grupos: si el modo privado está activo, solo responde si es fromMe, owner o usuario permitido.
      if (modos.modoPrivado && !fromMe && !isOwner(sender) && !isAllowedUser(sender)) return;
    }

    // ⚠️ Si el "modo admins" está activado en este grupo, validar si el usuario es admin o el owner
    if (isGroup && modos.modoAdmins[chatId]) {
      const chatMetadata = await sock.groupMetadata(chatId).catch(() => null);
      if (chatMetadata) {
        const participant = chatMetadata.participants.find(p => p.id.includes(sender));
        const isAdmin = participant ? (participant.admin === "admin" || participant.admin === "superadmin") : false;
        if (!isAdmin && !isOwner(sender) && !fromMe) {
          return; // Ignorar mensaje si no es admin ni owner
        }
      }
    }

    // ✅ Detectar si es un comando
    if (messageText.startsWith(global.prefix)) {
      const command = messageText.slice(global.prefix.length).trim().split(" ")[0].toLowerCase();
      const args = messageText.slice(global.prefix.length + command.length).trim().split(" ");
      
      console.log(`🤖 Procesando comando: ${command} con argumentos:`, args);

      try {
        // Intentar ejecutar el comando
        const response = await handleCommand(sock, msg, command, args, sender);
        
        if (!response) {
          console.log(`❌ El comando ${command} no retornó respuesta`);
          // Enviar mensaje de comando no encontrado
          await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ Comando *${command}* no encontrado o sin respuesta.\n\nUsa *.menu* para ver los comandos disponibles.` 
          });
        }
      } catch (error) {
        console.error(`❌ Error ejecutando comando ${command}:`, error);
        await sock.sendMessage(msg.key.remoteJid, { 
          text: "❌ Ocurrió un error al procesar el comando." 
        });
      }

      // ⚙️ Comando para activar/desactivar "modo privado"
      if (command === "modoprivado" && (isOwner(sender) || fromMe)) {
        if (!["on", "off"].includes(args[0])) {
          await sock.sendMessage(chatId, { text: "⚠️ Usa `.modoprivado on` o `.modoprivado off`" });
          return;
        }
        modos.modoPrivado = args[0] === "on";
        guardarModos(modos);
        await sock.sendMessage(chatId, { text: `🔒 *Modo privado ${args[0] === "on" ? "activado" : "desactivado"}*` });
        return;
      }

      // ⚙️ Comando para activar/desactivar "modo admins" (solo en grupos)
      if (command === "modoadmins" && isGroup) {
        const chatMetadata = await sock.groupMetadata(chatId).catch(() => null);
        if (!chatMetadata) return;
        const participant = chatMetadata.participants.find(p => p.id.includes(sender));
        const isAdmin = participant ? (participant.admin === "admin" || participant.admin === "superadmin") : false;
        if (!isAdmin && !isOwner(sender) && !fromMe) {
          await sock.sendMessage(chatId, { text: "⚠️ *Solo los administradores pueden usar este comando.*" });
          return;
        }
        if (!["on", "off"].includes(args[0])) {
          await sock.sendMessage(chatId, { text: "⚠️ Usa `.modoadmins on` o `.modoadmins off` en un grupo." });
          return;
        }
        if (args[0] === "on") {
          modos.modoAdmins[chatId] = true; // Activar en este grupo
        } else {
          delete modos.modoAdmins[chatId]; // Desactivar en este grupo
        }
        guardarModos(modos);
        await sock.sendMessage(chatId, { text: `👑 *Modo admins ${args[0] === "on" ? "activado" : "desactivado"} en este grupo*` });
        return;
      }

      // 🔄 Enviar el comando a `main.js`
      handleCommand(sock, msg, command, args, sender);
    }

  } catch (error) {
    console.error("❌ Error en el evento messages.upsert:", error);
  }
});



            sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    if (connection === "connecting") {
        console.log(chalk.blue("🔄 Conectando a WhatsApp..."));
    } else if (connection === "open") {
        console.log(chalk.green("✅ ¡Conexión establecida con éxito!"));

        // 📌 Verificar si el bot se reinició con .rest y enviar mensaje
        const restarterFile = "./lastRestarter.json";
        if (fs.existsSync(restarterFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(restarterFile, "utf-8"));
                if (data.chatId) {
                    await sock.sendMessage(data.chatId, { text: "✅ *El bot está en línea nuevamente tras el reinicio.* 🚀" });
                    console.log(chalk.green("📢 Notificación enviada al chat del reinicio."));
                    fs.unlinkSync(restarterFile); // 🔄 Eliminar el archivo después de enviar el mensaje
                }
            } catch (error) {
                console.error("❌ Error al procesar lastRestarter.json:", error);
            }
        }
    } else if (connection === "close") {
        console.log(chalk.red("❌ Conexión cerrada. Intentando reconectar en 5 segundos..."));
        setTimeout(startBot, 5000);
    }
});

const path = require("path");

async function cargarSubbots() {
  const subbotFolder = "./subbots";
  const path = require("path");
  const fs = require("fs");
  const pino = require("pino");
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
  } = require("@whiskeysockets/baileys");

  // Función para cargar plugins exclusivos para subbots
  function loadSubPlugins() {
    const plugins = [];
    const pluginDir = path.join(__dirname, "plugins2");
    if (!fs.existsSync(pluginDir)) {
      console.log("📂 Creando directorio plugins2...");
      fs.mkdirSync(pluginDir);
      return plugins;
    }
    
    console.log("🔍 Cargando plugins para subbots...");
    const files = fs.readdirSync(pluginDir).filter((f) => f.endsWith(".js"));
    
    for (const file of files) {
      try {
        const plugin = require(path.join(pluginDir, file));
        if (plugin && plugin.command) {
          plugins.push(plugin);
          console.log(`✅ Plugin cargado: ${file}`);
        }
      } catch (error) {
        console.error(`❌ Error cargando plugin ${file}:`, error);
      }
    }
    
    console.log(`📚 Total plugins cargados: ${plugins.length}`);
    return plugins;
  }

  const subPlugins = loadSubPlugins();

  async function handleSubCommand(sock, msg, command, args) {
    const lowerCommand = command.toLowerCase();
    const text = args.join(" ");
    
    // Intentar cargar comando desde plugins2 primero
    const plugin = subPlugins.find((p) => p.command.includes(lowerCommand));
    if (plugin) {
      try {
        return await plugin(msg, {
          conn: sock,
          text,
          args,
          command: lowerCommand,
          usedPrefix: ".",
        });
      } catch (error) {
        console.error(`Error ejecutando plugin ${lowerCommand}:`, error);
        await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ Error al ejecutar el comando."
        });
      }
    }

    // Si no se encuentra en plugins2, intentar con main.js
    try {
      const { handleCommand: mainHandler } = require('./main');
      return await mainHandler(sock, msg, command, args);
    } catch (error) {
      console.error(`Error ejecutando comando desde main.js:`, error);
    }
  }

  if (!fs.existsSync(subbotFolder)) {
    return console.log("⚠️ No hay carpeta de subbots.");
  }

  const subDirs = fs
    .readdirSync(subbotFolder)
    .filter((d) => fs.existsSync(`${subbotFolder}/${d}/creds.json`));
  console.log(`🤖 Cargando ${subDirs.length} subbot(s) conectados...`);

  const subbotInstances = {};

  for (const dir of subDirs) {
    const sessionPath = path.join(subbotFolder, dir);
    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const { version } = await fetchLatestBaileysVersion();
      const subSock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Azura Subbot", "Firefox", "2.0"],
      });

      subbotInstances[dir] = {
        subSock,
        sessionPath,
        isConnected: false,
      };

      subSock.ev.on("creds.update", saveCreds);

      subSock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "open") {
          console.log(`✅ Subbot ${dir} conectado correctamente.`);
          subbotInstances[dir].isConnected = true;
        } else if (connection === "close") {
          console.log(`❌ Subbot ${dir} se desconectó.`);
          subbotInstances[dir].isConnected = false;
        }
      });

      subSock.ev.on("messages.upsert", async (messageUpsert) => {
        try {
          const msg = messageUpsert.messages[0];
          if (!msg || !msg.message) return;

          const messageText = msg.message?.conversation || 
                            msg.message?.extendedTextMessage?.text || 
                            msg.message?.imageMessage?.caption || 
                            msg.message?.videoMessage?.caption || "";

          // Solo procesar mensajes que empiecen con el prefijo
          if (!messageText.startsWith(".")) return;

          // Extraer comando y argumentos
          const args = messageText.slice(1).trim().split(/ +/);
          const command = args.shift().toLowerCase();

          // Procesar el comando a través del handler
          const text = args.join(" ");
          await handleSubCommand(subSock, msg, command, args, text);

          console.log(`📱 [SUBBOT] Comando procesado: ${command}`);

        } catch (err) {
          console.error("❌ Error procesando mensaje del subbot:", err);
          if (msg?.key?.remoteJid) {
            await subSock.sendMessage(msg.key.remoteJid, {
              text: "❌ Ocurrió un error al procesar el comando."
            });
          }
        }
      });
    } catch (err) {
      console.error(`❌ Error al cargar subbot ${dir}:`, err);
    }
  }
}

// Ejecutar después de iniciar el bot principal
setTimeout(cargarSubbots, 3000);
module.exports = { cargarSubbots };


            sock.ev.on("creds.update", saveCreds);

            // Manejo de errores global para evitar que el bot se detenga
            process.on("uncaughtException", (err) => {
                console.error(chalk.red("⚠️ Error no manejado:"), err);
            });

            process.on("unhandledRejection", (reason, promise) => {
                console.error(chalk.red("🚨 Promesa rechazada sin manejar:"), promise, "razón:", reason);
            });

        } catch (error) {
            console.error(chalk.red("❌ Error en la conexión:"), error);
            console.log(chalk.blue("🔄 Reiniciando en 5 segundos..."));
            setTimeout(startBot, 5000); // Intentar reconectar después de 5 segundos en caso de error
        }
    }

    startBot();
})();