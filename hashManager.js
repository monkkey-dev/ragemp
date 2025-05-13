const connection = require('../database/database.js');

function generateRandomHash() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '#';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function getOrCreatePlayerHash(socialID) {
    return new Promise((resolve, reject) => {
        // consulta la base de datos para ver si ya tiene un hash
        connection.query('SELECT rp_hash FROM players WHERE social_id = ?', [socialID], (err, results) => {
            if (err) {
                console.error('[HashManager] Error al consultar la base de datos:', err);
                return reject(err);
            }

            // si tiene hash, lo devolvemos
            if (results.length > 0 && results[0].rp_hash) {
                return resolve(results[0].rp_hash);
            }

            // si no tiene hash, generamos uno nuevo
            function tryGenerateUniqueHash() {
                const newHash = generateRandomHash();

                // evitar duplicados y colisiones
                connection.query('SELECT id FROM players WHERE rp_hash = ?', [newHash], (err, results) => {
                    if (err) {
                        console.error('[HashManager] Error al verificar colisión de hash:', err);
                        return reject(err);
                    }

                    if (results.length > 0) {
                        // existe, crea otro
                        return tryGenerateUniqueHash();
                    } else {
                        // no existe, lo guardamos
                        resolve(newHash);
                    }
                });
            }

            tryGenerateUniqueHash();
        });
    });
}

module.exports = { getOrCreatePlayerHash };
