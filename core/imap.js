import Imap from 'imap';

const imap = new Imap({
  user: 'alishadman955@gmail.com',
  password: process.env.GMAIL_TOKEN,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { servername: 'imap.gmail.com' },
});

const imapAmex = new Imap({
  user: 'alishadman69@gmail.com',
  password: process.env.GMAIL_AMEX_TOKEN,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { servername: 'imap.gmail.com' },
});

export { imap, imapAmex };
export default { imap, imapAmex };
