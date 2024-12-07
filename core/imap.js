import Imap from 'imap';

const imap = new Imap({
  user: process.env.GMAIL_MAIL,
  password: process.env.GMAIL_TOKEN,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { servername: 'imap.gmail.com' },
});

export { imap };
export default imap;
