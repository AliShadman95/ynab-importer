import * as dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';
const envType = process.env.ENV_TYPE || 'default';

console.log(`NODE_ENV: ${env}`);
console.log(`ENV_TYPE: ${envType}`);

const envFile = `.env.${env}${envType !== 'default' ? `.${envType}` : ''}`;

console.log(`Loading environment variables from: ${envFile}`);
export default dotenv.config({ path: envFile });
