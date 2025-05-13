const connection = require("../database/database.js");


/* 
 * 
 * * COMANDOS DE ROL
 * 
 */

mp.events.addCommand("b", (player, arg) => { 
    if (!arg) {
        player.outputChatBox("Uso: /b <mensaje>.");
        return;
    }

    const message = `!{ffffff} ${player.rpHash}: (( ${arg} ))`

    mp.players.forEachInRange(player.position, 20, (nearbyPlayer) => {
        nearbyPlayer.outputChatBox(message);
    });
});

mp.events.addCommand("me", (player, arg) => {
    if (!arg) {
        player.outputChatBox("Uso: /me <accion>.");
        return;
    }

    const message = `!{#8f4eab} ${player.rpHash} ${arg}`;

    mp.players.forEachInRange(player.position, 20, (nearbyPlayer) => {
        nearbyPlayer.outputChatBox(message);
    });
});


mp.events.addCommand("do", (player, arg) => {
    if (!arg) {
        player.outputChatBox("Uso: /do <accion>.");
        return;
    }

    const message = `!{#1c7e26} [${player.rpHash}] ** ${arg}`;
    mp.players.forEachInRange(player.position, 20, (nearbyPlayer) => {
        nearbyPlayer.outputChatBox(message);
    });
});

mp.events.addCommand("id", (player, arg) => {
    if (!arg) {
        player.outputChatBox("Tu ID es: " + player.rpHash);
        return;
    }
});

mp.events.addCommand("dados", (player) => {
    let dado1 = Math.floor(Math.random() * 6) + 1;

    const message = `!{#FF4444} ${player.rpHash} tiró los dados y sacó: ${dado1}`;
    mp.players.forEachInRange(player.position, 20, (nearbyPlayer) => {
        nearbyPlayer.outputChatBox(message);
    });
});

mp.events.addCommand("ayuda", (player) => {
    player.outputChatBox("Comandos disponibles:");
    player.outputChatBox("/id - Mostrar tu ID.");
    player.outputChatBox("/dados - Tirar los dados.");
    player.outputChatBox("/b <mensaje> - Hablar en OOC.");
    player.outputChatBox("/me <accion> - Hacer una acción.");
    player.outputChatBox("/do <accion> - Describir una acción o un elemento del entorno.")
});

/**
 * 
 * * COMANDOS ADMINISTRATIVOS
 * 
 */

mp.events.addCommand("setadmin", (admin, fullText) => {

    const args = fullText.trim().split(/\s+/);

    if (!admin.isAdmin) {
        player.outputChatBox("!{#FF4444}No tienes permiso para usar este comando.");
        return;
    }

    if (args.length < 2) {
        admin.outputChatBox("Uso: /setadmin [hash] [true/false]");
        return;
    }

    const targetHash = args[0].toUpperCase();
    const statusArg = args[1].toLowerCase();

    const newStatus = statusArg === 'true' ? 1 : 0;

    if (statusArg !== 'true' && statusArg !== 'false') {
        admin.outputChatBox("El segundo parámetro debe ser 'true' o 'false'.");
        return;
    }

    // Online
    const targetPlayer = mp.players.toArray().find(p => p.rpHash === targetHash);

    connection.query(
        "UPDATE players SET isAdmin = ? WHERE rp_hash = ?",
        [newStatus, targetHash],
        (err, result) => {
            if (err) {
                console.error("Error al actualizar isAdmin:", err);
                admin.outputChatBox("Hubo un error al actualizar el estado de admin.");
                return;
            }

            if (result.affectedRows === 0) {
                admin.outputChatBox(`No se encontró ningún jugador con el hash ${targetHash}.`);
                return;
            }

            // si está conectado, actualiza su estado
            if (targetPlayer) {
                targetPlayer.isAdmin = !!newStatus;

                if (!!newStatus) {
                    targetPlayer.outputChatBox("¡Felicidades! Ahora eres administrador. Por favor, reinicia el juego para aplicar los cambios.");
                    admin.outputChatBox(`El jugador con hash ${targetHash} ahora ES administrador.`);
                }
                else {
                    admin.outputChatBox(`El jugador con hash ${targetHash} ahora NO ES administrador.`);
                }
        }
    });
});

mp.events.addCommand("ban", (admin, args) => { // ECHARLE UN VISTAZO A ESTO, NO TERMINADO
    if (!admin.isAdmin) {
        admin.outputChatBox("!{#FF4444}No tienes permiso para usar este comando.");
        return;
    }

    if (args.length < 2) {
        admin.outputChatBox("Uso: /ban [hash] [minutos]");
        return;
    }

    const targetHash = args[0].toUpperCase();
    const banMinutes = parseInt(args[1]);

    if (isNaN(banMinutes) || banMinutes <= 0) {
        admin.outputChatBox("El tiempo debe ser un número mayor a 0.");
        return;
    }

    const targetPlayer = mp.players.toArray().find(p => p.rpHash === targetHash);

    if (!targetPlayer) {
        admin.outputChatBox(`No se encontró ningún jugador con hash ${targetHash}.`);

        // si está offline, actualiza la base de datos
        connection.query(
            "UPDATE players SET isBanned = true, banExpires = ? WHERE rp_hash = ?",
            [new Date(Date.now() + banMinutes * 60000), targetHash],
            (err, result) => {
                if (err) {
                    console.error("Error al banear por hash:", err);
                    admin.outputChatBox("Error al aplicar el baneo offline.");
                    return;
                }

                if (result.affectedRows === 0) {
                    admin.outputChatBox(`No se encontró un jugador con el hash ${targetHash} en la base de datos.`);
                } else {
                    admin.outputChatBox(`Has baneado a ${targetHash} (offline) durante ${banMinutes} minutos.`);
                }
            }
        );
        return;
    }

    const banUntil = new Date(Date.now() + banMinutes * 60000);

    // baneo online
    connection.query(
        "UPDATE players SET isBanned = true, banExpires = ? WHERE rp_hash = ?",
        [banUntil, targetHash],
        (err) => {
            if (err) {
                console.error("Error al banear:", err);
                admin.outputChatBox("Error al aplicar el baneo.");
                return;
            }

            targetPlayer.outputChatBox(`Has sido baneado por ${banMinutes} minutos.`);
            targetPlayer.ban("Has sido baneado del servidor.");

            admin.outputChatBox(`Has baneado a ${targetHash} durante ${banMinutes} minutos.`);
        }
    );
});

mp.events.addCommand('car', (player, _, model) => {
    if (!player.isAdmin) {
        player.outputChatBox("!{#FF4444}No tienes permiso para usar este comando.");
        return;
    }

    if (!model) {
        player.outputChatBox("!{#AAAAAA}Uso: /car [nombreModelo]");
        return;
    }

    const pos = player.position;
    const heading = player.heading;

    try {
        const vehicle = mp.vehicles.new(
            mp.joaat(model),
            new mp.Vector3(pos.x + 2, pos.y, pos.z),
            {
                heading: heading,
                numberPlate: "ADMIN",
                color: [[0, 0, 0], [0, 0, 0]],
                dimension: player.dimension
            }
        );

        vehicle.setVariable('vehicleName', model);
        player.putIntoVehicle(vehicle, 0);
    } catch (err) {
        player.outputChatBox("!{#FF4444}Error al crear el vehículo.");
        console.error(err);
    }
});

mp.events.addCommand("delcar", (player) => {
    if (!player.isAdmin) {
        player.outputChatBox("!{#FF4444}No tienes permiso para usar este comando.");
        return;
    }

    if (player.vehicle) {
        player.vehicle.destroy();
    } else {
        player.outputChatBox("!{#FF4444}No estás en un vehículo.");
    }
});
