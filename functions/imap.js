import Imap from 'imap';
import categorize from '../utils/payeeHandler.js';
import postTransaction from './ynab.js';

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

  console.log(`Trovata una mail con il mittente: ${headers?.from[0]}`);
  const isCC = body.includes(ccValue);

  const price = body
    .split(isCC ? ' EUR' : ' con la')[0]
    .split(' ')
    [body.split(isCC ? ' EUR' : ' con la')[0].split(' ').length - 1].replace(
      '=',
      '',
    )
    .replace(/\s/g, '');

  const payee = body.split('presso')[1].split('.')[0];
  const categorizedPayee = categorize(payee);

  console.log(`Email con pagamento ricevuto, il prezzo è ${price}`);

  if (categorizedPayee) {
    await postTransaction(
      isCC ? 'mastercard' : 'intesa',
      price,
      categorizedPayee,
    );
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

  console.log(`Trovata una mail con il mittente: ${headers?.from[0]}`);

  // Regular expression to capture the operation details, the import number and the currency
  const regex = /\d{2}\/\d{2}\/\d{4}\s*([^\n]+)\s*(\d+,\d+)\s*([A-Za-z]+)/;

  const match = body.match(regex);

  if (match) {
    const operationDetails = match[1].trim();
    const importNumber = match[2];

    const categorizedPayee = categorize(operationDetails);

    if (categorizedPayee) {
      await postTransaction('amex', importNumber, categorizedPayee);
    }
  } else {
    console.log('Match not found in the text.');
  }
}

function openInbox(imap, cb) {
  imap.openBox(process.env.INBOX, true, cb);
}

const runImap = (imap) => {
  console.log('Ready to receive emails!!!');

  imap.once('ready', function () {
    openInbox(imap, function (err, box) {
      if (err) throw err;

      imap.on('mail', function (msg) {
        console.log('New mail received');
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
            const isAmexImap = imap._config.user === 'alishadman69@gmail.com';

            console.log('Headers: ', headers);
            console.log('Body: ', body);

            if (isAmexImap) {
              await checkAmex(headers, body);
            } else {
              await checkIntesa(headers, body);
            }
          });
        });
        f.once('error', function (err) {
          console.log('Fetch error: ' + err);
        });
        f.once('end', function () {
          /*   imap.end(); */
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
