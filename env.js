import * as dotenv from 'dotenv';

// Ottieni NODE_ENV e ENV_TYPE dalle variabili d'ambiente
const env = process.env.NODE_ENV || 'development'; // Default a "development"
const envType = process.env.ENV_TYPE || 'default'; // Default a "default"

// Log delle variabili per verificare che siano lette correttamente
console.log(`NODE_ENV: ${env}`);
console.log(`ENV_TYPE: ${envType}`);

// Genera il percorso del file .env basandoti su NODE_ENV e ENV_TYPE
const envFile = `.env.${env}${envType !== 'default' ? `.${envType}` : ''}`;

// Carica il file .env
console.log(`Loading environment variables from: ${envFile}`);
export default dotenv.config({ path: envFile });
