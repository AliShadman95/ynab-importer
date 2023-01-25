import Imap from 'imap';
import config from '../credentials.js';

const imap = new Imap({
  user: 'alishadman955@gmail.com',
  password: config.gmail_pass,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { servername: 'imap.gmail.com' },
});

export { imap };
export default imap;
