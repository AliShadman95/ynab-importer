import Imap from 'imap';
import imap from '../core/imap.js';
import categorize from '../utils/payeeHandler.js';
import postTransaction from './ynab.js';

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}
const runImap = () => {
  imap.once('ready', function () {
    openInbox(function (err, box) {
      if (err) throw err;

      imap.on('mail', function (msg) {
        console.log('New mail received');
        let body = '';
        let headers = '';
        const fromMail = 'comunicazioni@intesasanpaolo.com';
        const ccValue = '5398_*_*_7143';

        var f = imap.seq.fetch(box.messages.total + ':*', {
          bodies: ['HEADER.FIELDS (FROM TO SUBJECT)', 'TEXT'],
        });

        f.on('message', function (msg) {
          msg.on('body', function (stream, info) {
            let bodyBuffer = '';
            let headersBuffer = '';

            stream.on('data', function (chunk) {
              if (info.which === 'TEXT') {
                bodyBuffer += chunk.toString();
              } else {
                headersBuffer += chunk.toString('utf8');
              }
            });
            stream.once('end', function () {
              if (info.which === 'TEXT') {
                body = bodyBuffer.toString();
              } else {
                headers = Imap.parseHeader(headersBuffer);
              }
            });
          });

          msg.once('end', async function () {
            if (headers && headers?.from[0]?.toLowerCase().includes(fromMail)) {
              console.log(
                `Trovata una mail con il mittente: ${headers?.from[0]}`,
              );
              const isCC = body.includes(ccValue);

              const price = body
                .split(' EUR')[0]
                .split(' ')
                [body.split(' EUR')[0].split(' ').length - 1].replace('=', '')
                .replace(/\s/g, '');

              const payee = body.split('presso')[1].split('.')[0];
              const categorizedPayee = categorize(payee);

              console.log(`Email con pagamento ricevuto, il prezzo è ${price}`);

              if (categorizedPayee) {
                await postTransaction(isCC, price, categorizedPayee);
              }
            }
          });
        });
        f.once('error', function (err) {
          console.log('Fetch error: ' + err);
        });
        f.once('end', function () {
          imap.end();
        });
      });
    });
  });

  imap.once('error', function (err) {
    console.log(err);
  });

  imap.once('end', function () {});

  imap.connect();
};

export { runImap };
export default runImap;
