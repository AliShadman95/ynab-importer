import Imap from 'imap';
import imap from '../core/imap.js';
import categorize from '../utils/payeeHandler.js';
/* import { postTransaction as postTransactionActual } from './actual.js'; */
import postTransaction from './ynab.js';
import * as cheerio from 'cheerio';
import qp from 'quoted-printable';
import { logWithTimestamp } from '../utils/logger.js';

// Decodifica quoted-printable
function decodeQuotedPrintable(input) {
  return input
    .replace(/=(?:\r\n|\n|\r)/g, '') // Rimuove soft line breaks
    .replace(/=([A-Fa-f0-9]{2})/g, (match, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    ); // Decodifica caratteri
}

async function checkIntesa(headers, body) {
  const fromMail = process.env.FROM_MAIL;
  const ccValue = process.env.CC;

  if (
    !headers ||
    !headers?.from[0]?.toLowerCase().includes(fromMail) ||
    !headers?.subject[0]?.toLowerCase().includes('pagamento')
  ) {
    return;
  }

  logWithTimestamp(`Trovata una mail con il mittente: ${headers?.from[0]}`);
  const isCC = ccValue && body.includes(ccValue);

  const payee = body.split('presso')[1].split('Cordiali saluti')[0];
  const categorizedPayee = categorize(payee);

  if (!categorizedPayee) {
    logWithTimestamp('Email ricevuta, ma payee non trovato');
    return;
  }

  const decodedContent = decodeQuotedPrintable(body);
  const regex = /(\d{1,3}(?:[.,]\d{2}))(?:\s?(?:euro|EUR))/i;
  const match = decodedContent.match(regex);

  if (match) {
    // Ricostruisci il prezzo, eliminando "="
    const price = `${match[1]}`;
    logWithTimestamp(`Email con pagamento ricevuto, il prezzo è ${price}`);

    await postTransaction(
      isCC ? 'mastercard' : 'intesa',
      price,
      categorizedPayee,
    );

    /* await postTransactionActual(
      isCC ? 'mastercard' : 'intesa',
      price,
      categorizedPayee,
    ); */
  } else {
    logWithTimestamp('Prezzo non trovato.');
  }
}

async function checkAmex(headers, body) {
  const fromMailAmex = process.env.FROM_MAIL_AMEX;

  if (
    !headers ||
    !headers?.from[0]?.toLowerCase().includes(fromMailAmex) ||
    !headers?.subject[0]?.toLowerCase().includes('conferma operazione')
  ) {
    return;
  }

  logWithTimestamp(`Trovata una mail con il mittente: ${headers?.from[0]}`);

  const $ = cheerio.load(body);

  // Extract the body content
  const cheerioedBody = $('p').text();

  const decodedBody = qp.decode(cheerioedBody);

  const isPlatinum = decodedBody.includes('Carta Platino');

  const finalBody = decodedBody
    .replace(
      'EURAttenzione: Questa mail Ã¨ una co  municazione di servizio e non una comunicazione contenente offerte promozio  nali. Non utilizzare lÂ´indirizzo di posta elettronica con cui Ã¨ s  tato inviato il presente email per richiedere informazioni o formulare ques  iti. Non verrÃ  dato alcun seguito alle email ricevute che saranno imme  diatamente cancellate.Dichiarazione sulla privacy. Clicca qui per maggiori dettagli   sulle pratiche relative alle comunicazioni via e-mail, e per consultare la   Dichiarazione sulla privacy di American Express.Â Questa email Ã¨ stata in  viata a alishadman955@gmail.comÂ Â©2024 American Express Company. All righ  ts reserved.INTUNALE0020007SAM0FYI023',
      '',
    )
    .replaceAll(' ', '');

  // Regular expression to capture the operation details, the import number and the currency
  const pattern = /(\d{1,2}\/\d{1,2}\/\d{4})([A-Za-z]+)(\d+,\d{2})/;
  const match = finalBody.match(pattern);

  if (match) {
    var payee = match[2];
    var amount = match[3];

    const categorizedPayee = categorize(payee);

    if (categorizedPayee) {
      await postTransaction(
        isPlatinum ? 'amex-plat' : 'amex',
        amount,
        categorizedPayee,
      );

      /*  await postTransactionActual('amex', amount, categorizedPayee); */
    }
  } else {
    logWithTimestamp('Match not found in the text.');
  }
}

function openInbox(cb) {
  imap.openBox(process.env.INBOX, true, cb);
}
const runImap = () => {
  logWithTimestamp('Ready to receive emails!!!');

  imap.once('ready', function () {
    openInbox(function (err, box) {
      if (err) throw err;

      imap.on('mail', function (msg) {
        logWithTimestamp('New mail received');
        let body = '';
        let headers = '';

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
            await checkIntesa(headers, body);
            if (process.env.AMEX_ENABLED === 'true') {
              await checkAmex(headers, body);
            }
          });
        });
        f.once('error', function (err) {
          logWithTimestamp('Fetch error: ' + err);
        });
        f.once('end', function () {
          /*   imap.end(); */
        });
      });
    });
  });

  imap.once('error', function (err) {
    logWithTimestamp(err);
  });

  imap.once('end', function () {});

  imap.connect();
};

export { runImap };
export default runImap;
