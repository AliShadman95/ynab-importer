import Imap from 'imap';
import imap from '../core/imap.js';
import categorize from '../utils/payeeHandler.js';
import postTransaction from './ynab.js';
import * as cheerio from 'cheerio';
import qp from 'quoted-printable';

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
  const isCC = ccValue && body.includes(ccValue);

  let price = '';

  if (isCC) {
    const firstBodyPart = body.split(' EUR')[0].split(' ');

    price = firstBodyPart[firstBodyPart.length - 1]
      .replace('=', '')
      .replace(/\s/g, '');
  } else {
    const firstBodyPart = body.split(' con la')[0].split(' ');

    price =
      firstBodyPart[firstBodyPart.length - 1] === 'euro' ||
      firstBodyPart[firstBodyPart.length - 1] === 'EUR'
        ? firstBodyPart[firstBodyPart.length - 2]
        : firstBodyPart[firstBodyPart.length - 1]
            .replace('=', '')
            .replace(/\s/g, '')
            .replace('euro', 'EUR');
  }

  const payee = body.split('presso')[1].split('Cordiali saluti')[0];
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

  console.log('originalBody', body);

  const a = `body <!doctype html><html lang=3D"it" xmlns=3D"http://www.w3.org/1999/xhtml" xml=
  ns:v=3D"urn:schemas-microsoft-com:vml" xmlns:o=3D"urn:schemas-microsoft-com=
  :office:office"><head><title></title><!--[if !mso]><!-- --><meta http-equiv=
  =3D"X-UA-Compatible" content=3D"IE=3Dedge"><!--<![endif]--><meta http-equiv=
  =3D"Content-Type" content=3D"text/html; charset=3DUTF-8"><meta name=3D"view=
  port" content=3D"width=3Ddevice-width,initial-scale=3D1"><style type=3D"tex=
  t/css">#outlook a {=0A      padding: 0;=0A    }=0A=0A    body {=0A      mar=
  gin: 0;=0A      padding: 0;=0A      -webkit-text-size-adjust: 100%;=0A     =
   -ms-text-size-adjust: 100%;=0A    }=0A=0A    table,=0A    td {=0A      bor=
  der-collapse: collapse;=0A      mso-table-lspace: 0pt;=0A      mso-table-rs=
  pace: 0pt;=0A    }=0A=0A    img {=0A      border: 0;=0A      height: auto;=
  =0A      line-height: 100%;=0A      outline: none;=0A      text-decoration:=
   none;=0A      -ms-interpolation-mode: bicubic;=0A    }=0A=0A    p {=0A    =
    display: block;=0A      margin: 13px 0;=0A    }</style><!--[if mso]>=0A  =
        <xml>=0A        <o:OfficeDocumentSettings>=0A          <o:AllowPNG/>=
  =0A          <o:PixelsPerInch>96</o:PixelsPerInch>=0A        </o:OfficeDocu=
  mentSettings>=0A        </xml>=0A        <![endif]--><!--[if lte mso 11]>=0A=
          <style type=3D"text/css">=0A          .mj-outlook-group-fix { width=
  :100% !important; }=0A        </style>=0A        <![endif]--><!--[if gte ms=
  o 9]>=0A        <style>=0A        li {=0A            text-indent: -1em;=0A =
         }=0A        </style>=0A        <![endif]--><style type=3D"text/css">=
  @media only screen and (min-width:480px) {=0A      .mj-column-per-100 {=0A =
         width: 100% !important;=0A        max-width: 100%;=0A      }=0A=0A  =
      .mj-column-per-6 {=0A        width: 6% !important;=0A        max-width:=
   6%;=0A      }=0A=0A      .mj-column-per-10 {=0A        width: 10% !importa=
  nt;=0A        max-width: 10%;=0A      }=0A=0A      .mj-column-per-78 {=0A  =
        width: 78% !important;=0A        max-width: 78%;=0A      }=0A=0A     =
   .mj-column-per-50 {=0A        width: 50% !important;=0A        max-width: =
  50%;=0A      }=0A=0A      .mj-column-per-33 {=0A        width: 33% !importa=
  nt;=0A        max-width: 33%;=0A      }=0A=0A      .mj-column-per-34 {=0A  =
        width: 34% !important;=0A        max-width: 34%;=0A      }=0A    }</s=
  tyle><style type=3D"text/css">@media only screen and (max-width:480px) {=0A=
        table.mj-full-width-mobile {=0A        width: 100% !important;=0A    =
    }=0A=0A      td.mj-full-width-mobile {=0A        width: auto !important;=
  =0A      }=0A    }</style><style type=3D"text/css">@media all and (max-widt=
  h: 480px) {=0A=0A      .mobile-body div:first-child,=0A      .mobile-body d=
  iv {=0A        margin: 0 auto !important;=0A        max-width: 310px !impor=
  tant;=0A      }=0A=0A      .body-1,=0A      .body-1 div {=0A        font-si=
  ze: 12px !important;=0A        font-weight: 400 !important;=0A        line-=
  height: 17px !important;=0A      }=0A=0A      .body-4,=0A      .body-4 div =
  {=0A        font-size: 22px !important;=0A        font-weight: 400 !importa=
  nt;=0A        line-height: 30px !important;=0A      }=0A=0A      .dls-logo-=
  bluebox-solid-sm,=0A      .dls-logo-bluebox-solid-sm img {=0A        width:=
   45px !important;=0A        height: 45px !important;=0A      }=0A=0A      .=
  dls-card-xs,=0A      .dls-card-xs img {=0A        width: 70px !important;=0A=
          height: 44px !important;=0A      }=0A=0A      .text-align-center,=0A=
        .text-align-center div {=0A        text-align: center !important;=0A =
       }=0A=0A      .text-align-left,=0A      .text-align-left div {=0A      =
    text-align: left !important;=0A      }=0A=0A      .btn-align-center,=0A  =
      .btn-align-center table {=0A        text-align: center !important;=0A  =
      }=0A=0A      .btn-align-center table {=0A        margin: 0 auto !import=
  ant;=0A      }=0A=0A      .dls-tagline-blue-sm td,=0A      .dls-tagline-blu=
  e-sm img {=0A        width: 220px !important;=0A      }=0A=0A      .nav-bar=
  -border-b {=0A        border-bottom: 1px solid #d9d9d6;=0A      }=0A=0A    =
    .in-img td,=0A      .in-img img {=0A        width: 100% !important;=0A   =
       height: auto !important;=0A      }=0A=0A      .pad-0,=0A      .pad-0-s=
  m div {=0A        padding: 0 !important;=0A      }=0A=0A      .pad-0-t,=0A =
       .pad-0-t-sm div {=0A        padding-top: 0 !important;=0A      }=0A=0A=
        .pad-0-b,=0A      .pad-0-b-sm div {=0A        padding-bottom: 0 !impo=
  rtant;=0A      }=0A=0A      .pad-0-l,=0A      .pad-0-l-sm div {=0A        p=
  adding-left: 0 !important;=0A      }=0A=0A      .pad-0-r,=0A      .pad-0-r-=
  sm div {=0A        padding-right: 0 !important;=0A      }=0A=0A      .pad-0=
  -lr,=0A      .pad-0-lr-sm div {=0A        padding-left: 0 !important;=0A   =
       padding-right: 0 !important;=0A      }=0A=0A      .pad-0-tb,=0A      .=
  pad-0-tb-sm div {=0A        padding-top: 0 !important;=0A        padding-bo=
  ttom: 0 !important;=0A      }=0A=0A      .pad-1,=0A      .pad-1-sm div {=0A=
          padding: 10px !important;=0A      }=0A=0A      .pad-1-t,=0A      .p=
  ad-1-t-sm div {=0A        padding-top: 10px !important;=0A      }=0A=0A    =
    .pad-1-b,=0A      .pad-1-b-sm div {=0A        padding-bottom: 10px !impor=
  tant;=0A      }=0A=0A      .pad-1-l,=0A      .pad-1-l-sm div {=0A        pa=
  dding-left: 10px !important;=0A      }=0A=0A      .pad-1-r,=0A      .pad-1-=
  r-sm div {=0A        padding-right: 10px !important;=0A      }=0A=0A      .=
  pad-1-lr,=0A      .pad-1-lr-sm div {=0A        padding-left: 10px !importan=
  t;=0A        padding-right: 10px !important;=0A      }=0A=0A      .pad-1-tb=
  ,=0A      .pad-1-tb-sm div {=0A        padding-top: 10px !important;=0A    =
      padding-bottom: 10px !important;=0A      }=0A=0A      .pad-2,=0A      .=
  pad-2-sm div {=0A        padding: 20px !important;=0A      }=0A=0A      .pa=
  d-2-t,=0A      .pad-2-t-sm div {=0A        padding-top: 20px !important;=0A=
        }=0A=0A      .pad-2-b,=0A      .pad-2-b-sm div {=0A        padding-bo=
  ttom: 20px !important;=0A      }=0A=0A      .pad-2-l,=0A      .pad-2-l-sm d=
  iv {=0A        padding-left: 20px !important;=0A      }=0A=0A      .pad-2-r=
  ,=0A      .pad-2-r-sm div {=0A        padding-right: 20px !important;=0A   =
     }=0A=0A      .pad-2-lr,=0A      .pad-2-lr-sm div {=0A        padding-lef=
  t: 20px !important;=0A        padding-right: 20px !important;=0A      }=0A=
  =0A      .pad-2-tb,=0A      .pad-2-tb-sm div {=0A        padding-top: 20px =
  !important;=0A        padding-bottom: 20px !important;=0A      }=0A=0A     =
   .pad-3,=0A      .pad-3-sm div {=0A        padding: 30px !important;=0A    =
    }=0A=0A      .pad-3-t,=0A      .pad-3-t-sm div {=0A        padding-top: 3=
  0px !important;=0A      }=0A=0A      .pad-3-b,=0A      .pad-3-b-sm div {=0A=
          padding-bottom: 30px !important;=0A      }=0A=0A      .pad-3-l,=0A =
       .pad-3-l-sm div {=0A        padding-left: 30px !important;=0A      }=0A=
  =0A      .pad-3-r,=0A      .pad-3-r-sm div {=0A        padding-right: 30px =
  !important;=0A      }=0A=0A      .pad-3-lr,=0A      .pad-3-lr-sm div {=0A  =
        padding-left: 30px !important;=0A        padding-right: 30px !importa=
  nt;=0A      }=0A=0A      .pad-3-tb,=0A      .pad-3-tb-sm div {=0A        pa=
  dding-top: 30px !important;=0A        padding-bottom: 30px !important;=0A  =
      }=0A=0A      .pad-4,=0A      .pad-4-sm div {=0A        padding: 40px !i=
  mportant;=0A      }=0A=0A      .pad-4-t,=0A      .pad-4-t-sm div {=0A      =
    padding-top: 40px !important;=0A      }=0A=0A      .pad-4-b,=0A      .pad=
  -4-b-sm div {=0A        padding-bottom: 40px !important;=0A      }=0A=0A   =
     .pad-4-l,=0A      .pad-4-l-sm div {=0A        padding-left: 40px !import=
  ant;=0A      }=0A=0A      .pad-4-r,=0A      .pad-4-r-sm div {=0A        pad=
  ding-right: 40px !important;=0A      }=0A=0A      .pad-4-lr,=0A      .pad-4=
  -lr-sm div {=0A        padding-left: 40px !important;=0A        padding-rig=
  ht: 40px !important;=0A      }=0A=0A      .pad-4-tb,=0A      .pad-4-tb-sm d=
  iv {=0A        padding-top: 40px !important;=0A        padding-bottom: 40px=
   !important;=0A      }=0A=0A      .dt,=0A      .dt div {=0A        font-wei=
  ght: bold !important;=0A      }=0A=0A      .dls-gray-06,=0A      .dls-gray-=
  06 div {=0A        color: #333 !important;=0A      }=0A=0A      .dls-gray-0=
  6-bg,=0A      .dls-gray-06-bg div {=0A        background-color: #333 !impor=
  tant;=0A      }=0A=0A      .dls-gray-06-bg-hvr:hover,=0A      .dls-gray-06-=
  bg-hvr div:hover {=0A        background-color: #333 !important;=0A      }=0A=
      }=0A=0A    .body-5 {=0A      font-family: "Helvetica Neue", Helvetica, =
  sans-serif;=0A      font-weight: 400;=0A      font-size: 26px;=0A      line=
  -height: 34px;=0A    }=0A=0A    .dls-gray-06 {=0A      color: #333;=0A    }=
  =0A=0A    .dls-gray-06-bg {=0A      background-color: #333;=0A    }=0A=0A  =
    .dls-gray-07 {=0A      color: #d9d9d6;=0A    }=0A=0A    .dls-gray-07-bg {=
  =0A      background-color: #d9d9d6;=0A    }=0A=0A    .dls-gray-07-bg-hvr:ho=
  ver {=0A      background-color: #d9d9d6;=0A    }=0A=0A    .text-underline-n=
  one {=0A      text-decoration: none;=0A    }=0A=0A    .pad-0-d,=0A    .pad-=
  0-d-sm div {=0A      padding: 0 !important;=0A    }=0A=0A    @media all and=
   (max-width: 480px) {=0A      .step tbody tr {=0A        display: inline-bl=
  ock !important;=0A      }=0A=0A      .divider tbody td p {=0A        border=
  -left-width: 2px;=0A        border-left-style: solid;=0A        height: 20p=
  x;=0A        border-top: 0 !important;=0A      }=0A=0A      .divider {=0A  =
        padding-left: 22px;=0A      }=0A=0A      .blue-border tbody td p {=0A=
          border-left-color: #00175a;=0A      }=0A=0A      .grey-border tbody=
   td p {=0A        border-left-color: #97999b;=0A      }=0A=0A      .mj-cust=
  om-column-per-20 {=0A        width: 20% !important;=0A      }=0A=0A      .m=
  j-custom-column-per-80 {=0A        width: 80% !important;=0A      }=0A=0A  =
      /* Image Module CSS for mobile */=0A      .squareImgSize td,=0A      .s=
  quareImgSize img {=0A        width: 230px !important;=0A        height: 230=
  px !important;=0A      }=0A=0A      .portraitImgSize td,=0A      .portraitI=
  mgSize img {=0A        width: 230px !important;=0A        height: 460px !im=
  portant;=0A      }=0A=0A      .landscapeImgSize td,=0A      .landscapeImgSi=
  ze img {=0A        width: 230px !important;=0A        height: 96px !importa=
  nt;=0A        max-height: 96px !important;=0A      }=0A=0A      .imageConte=
  nt>table>tbody>tr>td {=0A        padding: 0px !important;=0A      }=0A=0A  =
      /* END Image Module CSS for mobile */=0A    }=0A=0A    .margin-negative=
  -10 div {=0A      margin: 0 -10px;=0A    }=0A=0A    a[x-apple-data-detector=
  s] {=0A      color: inherit !important;=0A      text-decoration: none !impo=
  rtant;=0A      font-size: inherit !important;=0A      font-family: inherit =
  !important;=0A      font-weight: inherit !important;=0A      line-height: i=
  nherit !important;=0A    }=0A=0A    /* Image Module CSS for desktop */=0A  =
    .landscapeImgSize td,=0A    .landscapeImgSize img {=0A      max-height: 2=
  20px !important;=0A    }=0A=0A    .table-layout-fixed>table table {=0A     =
   table-layout: fixed;=0A    }=0A=0A    .word-break-all {=0A      width: 100=
  %;=0A      word-break: break-all;=0A      word-wrap: break-word;=0A    }=0A=
  =0A    /* END Image Module CSS for desktop */=0A    /* Partner Logo CSS */=
  =0A    .horizontalLogo td,=0A    .horizontalLogo img {=0A      max-height: =
  60px;=0A    }=0A=0A    /* END Partner Logo CSS */</style></head><body style=
  =3D"background-color:#d9d9d6;"><div class=3D"mobile-body" style=3D"backgrou=
  nd-color:#d9d9d6;" lang=3D"it"><!--[if mso | IE]><table align=3D"center" bo=
  rder=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"" role=3D"presentat=
  ion" style=3D"width:620px;" width=3D"620" bgcolor=3D"#ffffff" ><tr><td styl=
  e=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]=
  --><div style=3D"background:#ffffff;background-color:#ffffff;margin:0px aut=
  o;max-width:620px;"><table align=3D"center" border=3D"0" cellpadding=3D"0" =
  cellspacing=3D"0" role=3D"presentation" style=3D"background:#ffffff;backgro=
  und-color:#ffffff;width:100%;"><tbody><tr><td style=3D"direction:ltr;font-s=
  ize:0px;padding:20px 0;padding-bottom:0;padding-left:0;padding-right:0;padd=
  ing-top:0;text-align:center;"><!--[if mso | IE]><table role=3D"presentation=
  " border=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" width=
  =3D"620px" ><table align=3D"center" border=3D"0" cellpadding=3D"0" cellspac=
  ing=3D"0" class=3D"" role=3D"presentation" style=3D"width:620px;" width=3D"=
  620" ><tr><td style=3D"line-height:0px;font-size:0px;mso-line-height-rule:e=
  xactly;"><![endif]--><div style=3D"margin:0px auto;max-width:620px;"><table=
   align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"=
  presentation" style=3D"width:100%;"><tbody><tr><td style=3D"direction:ltr;f=
  ont-size:0px;padding:20px 0;padding-bottom:0;padding-left:0;padding-right:0=
  ;padding-top:0;text-align:center;"><!--[if mso | IE]><table role=3D"present=
  ation" border=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" =
  style=3D"vertical-align:top;width:620px;" ><![endif]--><div class=3D"mj-col=
  umn-per-100 mj-outlook-group-fix" style=3D"font-size:0px;text-align:left;di=
  rection:ltr;display:inline-block;vertical-align:top;width:100%;"><table bor=
  der=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D=
  "100%"><tbody><tr><td style=3D"background-color:#d9d9d6;vertical-align:top;=
  padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;"><table bord=
  er=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D=
  "100%"><tbody><tr><td align=3D"center" style=3D"font-size:0px;padding:10px =
  25px;word-break:break-word;"><div style=3D"font-family:&quot;Helvetica Neue=
  &quot;, Roboto, Helvetica, sans-serif;font-size:13px;font-weight:400;line-h=
  eight:20px;text-align:center;color:#333333;"><p style=3D"margin:0 0 0 0px">=
  Informazioni importanti sul tuo account</p></div></td></tr></tbody></table>=
  </td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endi=
  f]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></=
  td></tr><tr><td class=3D"" width=3D"620px" ><table align=3D"center" border=
  =3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"" role=3D"presentation"=
   style=3D"width:620px;" width=3D"620" ><tr><td style=3D"line-height:0px;fon=
  t-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style=3D"margin:=
  0px auto;max-width:620px;"><table align=3D"center" border=3D"0" cellpadding=
  =3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"width:100%;"><tbody=
  ><tr><td style=3D"direction:ltr;font-size:0px;padding:20px 0;padding-bottom=
  :0;padding-left:0;padding-right:0;padding-top:0;text-align:center;"><!--[if=
   mso | IE]><table role=3D"presentation" border=3D"0" cellpadding=3D"0" cell=
  spacing=3D"0"><tr><td class=3D"" style=3D"vertical-align:top;width:620px;" =
  ><![endif]--><div class=3D"mj-column-per-100 mj-outlook-group-fix" style=3D=
  "font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-=
  align:top;width:100%;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D=
  "0" role=3D"presentation" width=3D"100%"><tbody><tr><td style=3D"vertical-a=
  lign:top;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;"><t=
  able border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation"=
   width=3D"100%"><tbody><tr><td align=3D"left" class=3D"pad-1" style=3D"font=
  -size:0px;padding:10px 25px;padding-top:20px;padding-right:20px;padding-bot=
  tom:20px;padding-left:20px;word-break:break-word;"><table cellpadding=3D"0"=
   cellspacing=3D"0" width=3D"100%" border=3D"0" style=3D"color:#000000;font-=
  family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;line-height:1;ta=
  ble-layout:auto;width:100%;border:none;"><tr><td width=3D"15%" valign=3D"to=
  p"><img src=3D"https://cdaas.americanexpress.com/akamai/axp/comms/logos/log=
  o.png" alt=3D"American Express Logo" class=3D"dls-logo-bluebox-solid-sm" wi=
  dth=3D"60" height=3D"60"></td><td style=3D"font-family:&quot;Helvetica Neue=
  &quot;, Roboto, Helvetica, sans-serif;font-size:15px;font-weight:500;color:=
  #333;padding-left:10px;padding-right:10px" class=3D"pad-1-l pad-1-r" align=
  =3D"right" valign=3D"top"><p style=3D"display:inline-block;line-height:22px=
  ;margin:0" class=3D"body-1"><b>TITOLARE</b></p><p style=3D"font-weight:norm=
  al;line-height:22px;word-break:break-word;margin:0" class=3D"body-1">Ultime=
   6 cifre della Carta: 221006</p></td><td align=3D"right" width=3D"17%" vali=
  gn=3D"top"><img src=3D"https://secure.cmax.americanexpress.com/Internet/Car=
  dArt/EMEA/it-cardasset-config/images/GITGOLD00002.gif" alt=3D"Card Art" cla=
  ss=3D"dls-card-xs" width=3D"96" height=3D"60"></td></tr></table></td></tr><=
  /tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr>=
  </table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td>=
  </tr></table></td></tr><tr><td class=3D"" width=3D"620px" ><table align=3D"=
  center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"" role=3D=
  "presentation" style=3D"width:620px;" width=3D"620" bgcolor=3D"#006fcf" ><t=
  r><td style=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"=
  ><![endif]--><div style=3D"background:#006fcf;background-color:#006fcf;marg=
  in:0px auto;max-width:620px;"><table align=3D"center" border=3D"0" cellpadd=
  ing=3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"background:#006f=
  cf;background-color:#006fcf;width:100%;"><tbody><tr><td style=3D"direction:=
  ltr;font-size:0px;padding:20px 0;padding-bottom:0;padding-left:0;padding-ri=
  ght:0;padding-top:0;text-align:center;"><!--[if mso | IE]><table role=3D"pr=
  esentation" border=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=
  =3D"" style=3D"" ><table align=3D"center" border=3D"0" cellpadding=3D"0" ce=
  llspacing=3D"0" class=3D"" role=3D"presentation" style=3D"width:620px;" wid=
  th=3D"620" ><tr><td style=3D"line-height:0px;font-size:0px;mso-line-height-=
  rule:exactly;"><![endif]--><div style=3D"margin:0px auto;max-width:620px;">=
  <table align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" ro=
  le=3D"presentation" style=3D"width:100%;"><tbody><tr><td style=3D"direction=
  :ltr;font-size:0px;padding:20px 0;padding-bottom:0;padding-left:0;padding-r=
  ight:0;padding-top:0;text-align:center;"><!--[if mso | IE]><table role=3D"p=
  resentation" border=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=
  =3D"" width=3D"620px" ><table align=3D"center" border=3D"0" cellpadding=3D"=
  0" cellspacing=3D"0" class=3D"" role=3D"presentation" style=3D"width:620px;=
  " width=3D"620" bgcolor=3D"#006fcf" ><tr><td style=3D"line-height:0px;font-=
  size:0px;mso-line-height-rule:exactly;"><v:rect style=3D"width:620px;" xmln=
  s:v=3D"urn:schemas-microsoft-com:vml" fill=3D"true" stroke=3D"false"><v:fil=
  l origin=3D"0.5, 0" position=3D"0.5, 0" src=3D"https://cdaas.americanexpres=
  s.com/akamai/axp/comms/icons/hl-pattern-50pc.png" color=3D"#006fcf" type=3D=
  "tile" /><v:textbox style=3D"mso-fit-shape-to-text:true" inset=3D"0,0,0,0">=
  <![endif]--><div style=3D"background:#006fcf url('https://cdaas.americanexp=
  ress.com/akamai/axp/comms/icons/hl-pattern-50pc.png') center top / auto rep=
  eat;background-position:center top;background-repeat:repeat;background-size=
  :auto;margin:0px auto;max-width:620px;"><div style=3D"line-height:0;font-si=
  ze:0;"><table align=3D"center" background=3D"https://cdaas.americanexpress.=
  com/akamai/axp/comms/icons/hl-pattern-50pc.png" border=3D"0" cellpadding=3D=
  "0" cellspacing=3D"0" role=3D"presentation" style=3D"background:#006fcf url=
  ('https://cdaas.americanexpress.com/akamai/axp/comms/icons/hl-pattern-50pc.=
  png') center top / auto repeat;background-position:center top;background-re=
  peat:repeat;background-size:auto;width:100%;"><tbody><tr><td style=3D"direc=
  tion:ltr;font-size:0px;padding:20px 0;padding-bottom:40px;padding-top:40px;=
  text-align:center;"><!--[if mso | IE]><table role=3D"presentation" border=3D=
  "0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" style=3D"" ><tab=
  le align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=
  =3D"" role=3D"presentation" style=3D"width:620px;" width=3D"620" ><tr><td s=
  tyle=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![end=
  if]--><div style=3D"margin:0px auto;max-width:620px;"><table align=3D"cente=
  r" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" s=
  tyle=3D"width:100%;"><tbody><tr><td style=3D"direction:ltr;font-size:0px;pa=
  dding:20px 0;padding-bottom:0;padding-left:0;padding-right:0;padding-top:0;=
  text-align:center;"><!--[if mso | IE]><table role=3D"presentation" border=3D=
  "0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" width=3D"620px" =
  ><table align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" c=
  lass=3D"" role=3D"presentation" style=3D"width:620px;" width=3D"620" ><tr><=
  td style=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><!=
  [endif]--><div style=3D"margin:0px auto;max-width:620px;"><table align=3D"c=
  enter" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentatio=
  n" style=3D"width:100%;"><tbody><tr><td style=3D"direction:ltr;font-size:0p=
  x;padding:20px 0;padding-bottom:0;padding-left:0;padding-right:0;padding-to=
  p:0;text-align:center;"><!--[if mso | IE]><table role=3D"presentation" bord=
  er=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" style=3D"ve=
  rtical-align:middle;width:37.2px;" ><![endif]--><div class=3D"mj-column-per=
  -6 mj-outlook-group-fix" style=3D"font-size:0px;text-align:left;direction:l=
  tr;display:inline-block;vertical-align:middle;width:100%;"><table border=3D=
  "0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"vert=
  ical-align:middle;" width=3D"100%"><tbody></tbody></table></div><!--[if mso=
   | IE]></td><td class=3D"text-align-center-outlook" style=3D"vertical-align=
  :middle;width:62px;" ><![endif]--><div class=3D"mj-column-per-10 mj-outlook=
  -group-fix text-align-center" style=3D"font-size:0px;text-align:left;direct=
  ion:ltr;display:inline-block;vertical-align:middle;width:100%;"><table bord=
  er=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D=
  "100%"><tbody><tr><td style=3D"vertical-align:middle;padding-top:0;padding-=
  right:0;padding-bottom:0;padding-left:0;"><table border=3D"0" cellpadding=3D=
  "0" cellspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><td a=
  lign=3D"center" class=3D"pad-3-b" style=3D"font-size:0px;padding:10px 25px;=
  padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;word-break:br=
  eak-word;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"=
  presentation" style=3D"border-collapse:collapse;border-spacing:0px;"><tbody=
  ><tr><td style=3D"width:60px;"><img alt=3D"Alternate Text" height=3D"60" sr=
  c=3D"https://cdaas.americanexpress.com/akamai/axp/comms/icons/eds-library/b=
  lue-box/white-headline-icons-60px/warning-white.png" style=3D"border:0;disp=
  lay:block;outline:none;text-decoration:none;height:60px;width:100%;font-siz=
  e:13px;" width=3D"60"></td></tr></tbody></table></td></tr></tbody></table><=
  /td></tr></tbody></table></div><!--[if mso | IE]></td><td class=3D"" style=
  =3D"vertical-align:middle;width:483.6px;" ><![endif]--><div class=3D"mj-col=
  umn-per-78 mj-outlook-group-fix" style=3D"font-size:0px;text-align:left;dir=
  ection:ltr;display:inline-block;vertical-align:middle;width:100%;"><table b=
  order=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=
  =3D"100%"><tbody><tr><td style=3D"vertical-align:middle;padding-top:0;paddi=
  ng-right:0;padding-bottom:0;padding-left:0;"><table border=3D"0" cellpaddin=
  g=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><=
  td align=3D"left" class=3D"pad-0 pad-4-lr body-4 text-align-center" style=3D=
  "font-size:0px;padding:10px 25px;padding-top:0;padding-right:0;padding-bott=
  om:0;padding-left:20px;word-break:break-word;"><div style=3D"font-family:&q=
  uot;Helvetica Neue&quot;, Helvetica, sans-serif;font-size:26px;font-weight:=
  400;line-height:34px;text-align:left;color:#ffffff;"><p style=3D"margin:0 0=
   0 0px">Conferma Operazione</p></div></td></tr></tbody></table></td></tr></=
  tbody></table></div><!--[if mso | IE]></td><td class=3D"" style=3D"vertical=
  -align:middle;width:37.2px;" ><![endif]--><div class=3D"mj-column-per-6 mj-=
  outlook-group-fix" style=3D"font-size:0px;text-align:left;direction:ltr;dis=
  play:inline-block;vertical-align:middle;width:100%;"><table border=3D"0" ce=
  llpadding=3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"vertical-a=
  lign:middle;" width=3D"100%"><tbody></tbody></table></div><!--[if mso | IE]=
  ></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso =
  | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></t=
  able></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]-=
  -></td></tr></tbody></table></div></div><!--[if mso | IE]></v:textbox></v:r=
  ect></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></tab=
  le></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]-->=
  </td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></=
  tr><tr><td class=3D"" width=3D"620px" ><table align=3D"center" border=3D"0"=
   cellpadding=3D"0" cellspacing=3D"0" class=3D"" role=3D"presentation" style=
  =3D"width:620px;" width=3D"620" ><tr><td style=3D"line-height:0px;font-size=
  :0px;mso-line-height-rule:exactly;"><![endif]--><div style=3D"margin:0px au=
  to;max-width:620px;"><table align=3D"center" border=3D"0" cellpadding=3D"0"=
   cellspacing=3D"0" role=3D"presentation" style=3D"width:100%;"><tbody><tr><=
  td style=3D"direction:ltr;font-size:0px;padding:20px 0;padding-bottom:20px;=
  padding-left:40px;padding-right:40px;padding-top:20px;text-align:center;"><=
  !--[if mso | IE]><table role=3D"presentation" border=3D"0" cellpadding=3D"0=
  " cellspacing=3D"0"><tr><td class=3D"pad-0-outlook" style=3D"vertical-align=
  :top;width:540px;" ><![endif]--><div class=3D"mj-column-per-100 mj-outlook-=
  group-fix pad-0" style=3D"font-size:0px;text-align:left;direction:ltr;displ=
  ay:inline-block;vertical-align:top;width:100%;"><table border=3D"0" cellpad=
  ding=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><t=
  r><td style=3D"vertical-align:top;padding-top:0;padding-right:0;padding-bot=
  tom:0;padding-left:0;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D=
  "0" role=3D"presentation" width=3D"100%"><tbody><tr><td align=3D"left" styl=
  e=3D"font-size:0px;padding:10px 25px;padding-top:0;padding-right:0;padding-=
  bottom:0;padding-left:0;word-break:break-word;"><div style=3D"font-family:&=
  quot;Helvetica Neue&quot;, Roboto, Helvetica, sans-serif;font-size:15px;fon=
  t-weight:400;line-height:22px;text-align:left;color:#333333;"><p style=3D"m=
  argin:0 0 0 0px">Ti confermiamo che =C3=A8 stata eseguita su Carta di Credi=
  to Oro American Express=C2=AE una operazione superiore all=E2=80=99importo =
  di 1,00 EUR da te impostato per la notifica.</p><p style=3D"margin:0 0 0 0p=
  x">=C2=A0</p><p style=3D"margin:0 0 0 0px">Dettagli operazione:</p></div></=
  td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]><=
  /td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | =
  IE]></td></tr></table></td></tr><tr><td class=3D"" width=3D"620px" ><table =
  align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"=
  " role=3D"presentation" style=3D"width:620px;" width=3D"620" ><tr><td style=
  =3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-=
  -><div style=3D"margin:0px auto;max-width:620px;"><table align=3D"center" b=
  order=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" style=
  =3D"width:100%;"><tbody><tr><td style=3D"direction:ltr;font-size:0px;paddin=
  g:20px 0;padding-bottom:40px;padding-left:40px;padding-right:40px;padding-t=
  op:0;text-align:center;"><!--[if mso | IE]><table role=3D"presentation" bor=
  der=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"pad-0-outloo=
  k" style=3D"vertical-align:top;width:540px;" ><![endif]--><div class=3D"mj-=
  column-per-100 mj-outlook-group-fix pad-0" style=3D"font-size:0px;text-alig=
  n:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><=
  table border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation=
  " width=3D"100%"><tbody><tr><td style=3D"vertical-align:top;padding-top:0;p=
  adding-right:0;padding-bottom:0;padding-left:0;"><table border=3D"0" cellpa=
  dding=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><=
  /tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr>=
  </table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td>=
  </tr></table></td></tr><tr><td class=3D"" width=3D"620px" ><table align=3D"=
  center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"" role=3D=
  "presentation" style=3D"width:620px;" width=3D"620" bgcolor=3D"#f7f8f9" ><t=
  r><td style=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"=
  ><![endif]--><div style=3D"background:#f7f8f9;background-color:#f7f8f9;marg=
  in:0px auto;max-width:620px;"><table align=3D"center" border=3D"0" cellpadd=
  ing=3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"background:#f7f8=
  f9;background-color:#f7f8f9;width:100%;"><tbody><tr><td style=3D"direction:=
  ltr;font-size:0px;padding:20px 0;padding-bottom:10px;padding-left:40px;padd=
  ing-right:40px;padding-top:10px;text-align:center;"><!--[if mso | IE]><tabl=
  e role=3D"presentation" border=3D"0" cellpadding=3D"0" cellspacing=3D"0"><t=
  r><td class=3D"pad-0-outlook text-align-center-outlook" style=3D"" ><table =
  align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"=
  pad-0-outlook text-align-center-outlook" role=3D"presentation" style=3D"wid=
  th:540px;" width=3D"540" ><tr><td style=3D"line-height:0px;font-size:0px;ms=
  o-line-height-rule:exactly;"><![endif]--><div class=3D"pad-0 text-align-cen=
  ter" style=3D"margin:0px auto;max-width:540px;"><table align=3D"center" bor=
  der=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" style=3D=
  "width:100%;"><tbody><tr><td style=3D"direction:ltr;font-size:0px;padding:2=
  0px 0;padding-bottom:0;padding-left:0;padding-right:0;padding-top:0;text-al=
  ign:center;"><!--[if mso | IE]><table role=3D"presentation" border=3D"0" ce=
  llpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" width=3D"540px" ><tabl=
  e align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D=
  "" role=3D"presentation" style=3D"width:540px;" width=3D"540" ><tr><td styl=
  e=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]=
  --><div style=3D"margin:0px auto;max-width:540px;"><table align=3D"center" =
  border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" styl=
  e=3D"width:100%;"><tbody><tr><td style=3D"direction:ltr;font-size:0px;paddi=
  ng:20px 0;padding-bottom:20px;padding-left:0;padding-right:0;padding-top:20=
  px;text-align:center;"><!--[if mso | IE]><table role=3D"presentation" borde=
  r=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" style=3D"" >=
  <table align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" cl=
  ass=3D"" role=3D"presentation" style=3D"width:540px;" width=3D"540" ><tr><t=
  d style=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![=
  endif]--><div style=3D"margin:0px auto;max-width:540px;"><table align=3D"ce=
  nter" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation=
  " style=3D"width:100%;"><tbody><tr><td style=3D"direction:ltr;font-size:0px=
  ;padding:20px 0;padding-bottom:0;padding-left:0;padding-right:0;padding-top=
  :0;text-align:center;"><!--[if mso | IE]><table role=3D"presentation" borde=
  r=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" width=3D"540=
  px" ><table align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"=
  0" class=3D"" role=3D"presentation" style=3D"width:540px;" width=3D"540" ><=
  tr><td style=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;=
  "><![endif]--><div style=3D"margin:0px auto;max-width:540px;"><table align=
  =3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presen=
  tation" style=3D"width:100%;"><tbody><tr><td style=3D"border-bottom:1px sol=
  id #c8c9c7;border-top:1px solid #c8c9c7;direction:ltr;font-size:0px;padding=
  :20px 0;padding-bottom:0;padding-left:0;padding-right:0;padding-top:0;text-=
  align:center;"><!--[if mso | IE]><table role=3D"presentation" border=3D"0" =
  cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"" style=3D"vertical-al=
  ign:top;width:270px;" ><![endif]--><div class=3D"mj-column-per-50 mj-outloo=
  k-group-fix" style=3D"font-size:0px;text-align:left;direction:ltr;display:i=
  nline-block;vertical-align:top;width:100%;"><table border=3D"0" cellpadding=
  =3D"0" cellspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><t=
  d style=3D"vertical-align:top;padding-top:0;padding-right:0;padding-bottom:=
  0;padding-left:0;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D"0" =
  role=3D"presentation" width=3D"100%"><tbody><tr><td align=3D"left" class=3D=
  "pad-0 text-align-center pad-2-t" style=3D"font-size:0px;padding:10px 25px;=
  padding-top:20px;padding-right:40px;padding-bottom:20px;padding-left:60px;w=
  ord-break:break-word;"><div style=3D"font-family:&quot;Helvetica Neue&quot;=
  , Roboto, Helvetica, sans-serif;font-size:15px;font-weight:bold;line-height=
  :22px;text-align:left;color:#006fcf;"><p style=3D"margin:0 0 0 0px">17/01/2=
  024 PAYPAL</p></div></td></tr></tbody></table></td></tr></tbody></table></d=
  iv><!--[if mso | IE]></td><td class=3D"" style=3D"vertical-align:top;width:=
  270px;" ><![endif]--><div class=3D"mj-column-per-50 mj-outlook-group-fix" s=
  tyle=3D"font-size:0px;text-align:left;direction:ltr;display:inline-block;ve=
  rtical-align:top;width:100%;"><table border=3D"0" cellpadding=3D"0" cellspa=
  cing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><td style=3D"ver=
  tical-align:top;padding-top:0;padding-right:0;padding-bottom:0;padding-left=
  :0;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presen=
  tation" width=3D"100%"><tbody><tr><td align=3D"left" class=3D"pad-0 pad-2-b=
   text-align-center" style=3D"font-size:0px;padding:10px 25px;padding-top:20=
  px;padding-right:60px;padding-bottom:20px;padding-left:40px;word-break:brea=
  k-word;"><div style=3D"font-family:&quot;Helvetica Neue&quot;, Roboto, Helv=
  etica, sans-serif;font-size:15px;font-weight:bold;line-height:22px;text-ali=
  gn:left;color:#333333;"><p style=3D"margin:0 0 0 0px">2,00 EUR</p></div></t=
  d></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></=
  td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | I=
  E]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></tabl=
  e></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--><=
  /td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></t=
  r></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></t=
  d></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></di=
  v><!--[if mso | IE]></td></tr></table></td></tr><tr><td class=3D"" width=3D=
  "620px" ><table align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=
  =3D"0" class=3D"" role=3D"presentation" style=3D"width:620px;" width=3D"620=
  " ><tr><td style=3D"line-height:0px;font-size:0px;mso-line-height-rule:exac=
  tly;"><![endif]--><div style=3D"margin:0px auto;max-width:620px;"><table al=
  ign=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"pre=
  sentation" style=3D"width:100%;"><tbody><tr><td style=3D"direction:ltr;font=
  -size:0px;padding:20px 0;padding-bottom:10px;padding-left:40px;padding-righ=
  t:40px;padding-top:20px;text-align:center;"><!--[if mso | IE]><table role=3D=
  adding=3D"0" cellspacing=3D"0"><tr><td cla=
  ss=3D"pad-0-outlook" style=3D"vertical-align:top;width:540px;" ><![endif]--=
  ><div class=3D"mj-column-per-100 mj-outlook-group-fix pad-0" style=3D"font-=
  size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:=
  top;width:100%;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D"0" ro=
  le=3D"presentation" width=3D"100%"><tbody><tr><td style=3D"vertical-align:t=
  op;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;"><table b=
  order=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=
  =3D"100%"><tbody><tr><td align=3D"left" style=3D"font-size:0px;padding:10px=
   25px;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;word-br=
  eak:break-word;"><div style=3D"font-family:&quot;Helvetica Neue&quot;, Robo=
  to, Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:22px;t=
  ext-align:left;color:#333333;"><p style=3D"margin:0 0 0 0px">Alcune operazi=
  oni, come ad esempio quelle eseguite presso i distributori di benzina, hote=
  l e noleggio auto possono richiedere una pre-autorizzazione e pertanto l=C2=
  =B4importo mostrato nell=C2=B4Alert potrebbe non corrispondere all=C2=B4imp=
  orto esatto dell=C2=B4operazione finale.</p></div></td></tr></tbody></table=
  ></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![end=
  if]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><=
  /td></tr><tr><td class=3D"" width=3D"620px" ><table align=3D"center" border=
  =3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"" role=3D"presentation"=
   style=3D"width:620px;" width=3D"620" ><tr><td style=3D"line-height:0px;fon=
  t-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style=3D"margin:=
  0px auto;max-width:620px;"><table align=3D"center" border=3D"0" cellpadding=
  =3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"width:100%;"><tbody=
  ><tr><td style=3D"direction:ltr;font-size:0px;padding:20px 0;padding-bottom=
  :40px;padding-left:40px;padding-right:40px;padding-top:40px;text-align:cent=
  er;"><!--[if mso | IE]><table role=3D"presentation" border=3D"0" cellpaddin=
  g=3D"0" cellspacing=3D"0"><tr><td class=3D"" style=3D"vertical-align:top;wi=
  dth:270px;" ><![endif]--><div class=3D"mj-column-per-50 mj-outlook-group-fi=
  x" style=3D"font-size:0px;text-align:left;direction:ltr;display:inline-bloc=
  k;vertical-align:top;width:100%;"><table border=3D"0" cellpadding=3D"0" cel=
  lspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><td style=3D=
  "vertical-align:top;padding-top:0;padding-right:0;padding-bottom:0;padding-=
  left:0;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"pr=
  esentation" width=3D"100%"><tbody><tr><td align=3D"left" vertical-align=3D"=
  middle" class=3D"pad-0 pad-0-d btn-align-center" style=3D"font-size:0px;pad=
  ding:10px 25px;padding-top:13px;padding-right:0;padding-bottom:0;padding-le=
  ft:0;word-break:break-word;"><table border=3D"0" cellpadding=3D"0" cellspac=
  ing=3D"0" role=3D"presentation" style=3D"border-collapse:separate;width:230=
  px;line-height:100%;"><tbody><tr><td align=3D"center" bgcolor=3D"#00175a" r=
  ole=3D"presentation" style=3D"border:1px solid #00175a;border-radius:5px;cu=
  rsor:auto;mso-padding-alt:8px 25px;background:#00175a;" valign=3D"middle"><=
  a href=3D"https://www.americanexpress.com/Tracking=3Fmid=3DIUCOM03020240117=
  1200114143016380&msrc=3DENG-ALERTS&url=3Dhttps%3A%2F%2Fglobal.americanexpre=
  ss.com%2Fmyca%2Fintl%2Festatement%2Femea%2Fstatement.do%3Frequest_type%3D%2=
  6Face%3Dit_IT%26BPIndex%3D0%26sorted_index%3D0" style=3D"display:inline-blo=
  ck;width:178px;background:#00175a;color:#ffffff;font-family:Helvetica, Aria=
  l, Roboto, sans-serif;font-size:15px;font-weight:400;line-height:22px;margi=
  n:0;text-decoration:none;text-transform:none;padding:8px 25px;mso-padding-a=
  lt:0px;border-radius:5px;" target=3D"_blank">Visualizza spese recenti</a></=
  td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table=
  ></div><!--[if mso | IE]></td><td class=3D"pad-2-t-outlook" style=3D"vertic=
  al-align:top;width:270px;" ><![endif]--><div class=3D"mj-column-per-50 mj-o=
  utlook-group-fix pad-2-t" style=3D"font-size:0px;text-align:left;direction:=
  ltr;display:inline-block;vertical-align:top;width:100%;"><table border=3D"0=
  " cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D"100%">=
  <tbody><tr><td style=3D"vertical-align:top;padding-top:0;padding-right:0;pa=
  dding-bottom:0;padding-left:0;"><table border=3D"0" cellpadding=3D"0" cells=
  pacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><td align=3D"r=
  ight" vertical-align=3D"middle" class=3D"pad-0 pad-0-d btn-align-center" st=
  yle=3D"font-size:0px;padding:10px 25px;padding-top:13px;padding-right:0;pad=
  ding-bottom:0;padding-left:0;word-break:break-word;"><table border=3D"0" ce=
  llpadding=3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"border-col=
  lapse:separate;width:230px;line-height:100%;"><tbody><tr><td align=3D"cente=
  r" bgcolor=3D"#ffffff" role=3D"presentation" style=3D"border:1px solid #001=
  75a;border-radius:5px;cursor:auto;mso-padding-alt:8px 25px;background:#ffff=
  ff;" valign=3D"middle"><a href=3D"https://www.americanexpress.com/Tracking=
  =3Fmid=3DIUCOM030202401171200114143016380&msrc=3DENG-ALERTS&url=3Dhttp%3A%2=
  F%2Fwww.americanexpress.it%2Falerts" style=3D"display:inline-block;width:17=
  8px;background:#ffffff;color:#00175a;font-family:Helvetica, Arial, Roboto, =
  sans-serif;font-size:15px;font-weight:400;line-height:22px;margin:0;text-de=
  coration:none;text-transform:none;padding:8px 25px;mso-padding-alt:0px;bord=
  er-radius:5px;" target=3D"_blank">Gestisci i miei avvisi</a></td></tr></tbo=
  dy></table></td></tr></tbody></table></td></tr></tbody></table></div><!--[i=
  f mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><=
  !--[if mso | IE]></td></tr></table></td></tr><tr><td class=3D"" width=3D"62=
  0px" ><table align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D=
  "0" class=3D"" role=3D"presentation" style=3D"width:620px;" width=3D"620" b=
  gcolor=3D"#00175a" ><tr><td style=3D"line-height:0px;font-size:0px;mso-line=
  -height-rule:exactly;"><![endif]--><div style=3D"background:#00175a;backgro=
  und-color:#00175a;margin:0px auto;max-width:620px;"><table align=3D"center"=
   border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" sty=
  le=3D"background:#00175a;background-color:#00175a;width:100%;"><tbody><tr><=
  td style=3D"direction:ltr;font-size:0px;padding:20px 0;padding-bottom:20px;=
  padding-left:0;padding-right:0;padding-top:20px;text-align:center;"><!--[if=
   mso | IE]><table role=3D"presentation" border=3D"0" cellpadding=3D"0" cell=
  spacing=3D"0"><tr><td class=3D"" style=3D"vertical-align:top;width:620px;" =
  ><![endif]--><div class=3D"mj-column-per-100 mj-outlook-group-fix" style=3D=
  "font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-=
  align:top;width:100%;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D=
  "0" role=3D"presentation" width=3D"100%"><tbody><tr><td style=3D"vertical-a=
  lign:top;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;"><t=
  able border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation"=
   width=3D"100%"><tbody><tr><td align=3D"center" class=3D"dls-tagline-blue-s=
  m" style=3D"font-size:0px;padding:10px 25px;padding-top:0;padding-right:0;p=
  adding-bottom:0;padding-left:0;word-break:break-word;"><table border=3D"0" =
  cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"border-c=
  ollapse:collapse;border-spacing:0px;"><tbody><tr><td style=3D"width:240px;"=
  ><img alt=3D"Alternate Text" height=3D"auto" src=3D"https://cdaas.americane=
  xpress.com/akamai/axp/comms/taglines/consumer-tagline-english.png" style=3D=
  "border:0;display:block;outline:none;text-decoration:none;height:auto;width=
  :100%;font-size:13px;" width=3D"240"></td></tr></tbody></table></td></tr></=
  tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr><=
  /table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td><=
  /tr></table></td></tr><tr><td class=3D"" width=3D"620px" ><table align=3D"c=
  enter" border=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"" role=3D"=
  presentation" style=3D"width:620px;" width=3D"620" ><tr><td style=3D"line-h=
  eight:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div sty=
  le=3D"margin:0px auto;max-width:620px;"><table align=3D"center" border=3D"0=
  " cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" style=3D"width:=
  100%;"><tbody><tr><td style=3D"direction:ltr;font-size:0px;padding:20px 0;p=
  adding-bottom:0;padding-left:0;padding-right:0;padding-top:0;text-align:cen=
  ter;"><!--[if mso | IE]><table role=3D"presentation" border=3D"0" cellpaddi=
  ng=3D"0" cellspacing=3D"0"><tr><td class=3D"text-align-center-outlook nav-b=
  ar-border-b-outlook" style=3D"vertical-align:middle;width:204.6px;" ><![end=
  if]--><div class=3D"mj-column-per-33 mj-outlook-group-fix text-align-center=
   nav-bar-border-b" style=3D"font-size:0px;text-align:left;direction:ltr;dis=
  play:inline-block;vertical-align:middle;width:100%;"><table border=3D"0" ce=
  llpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D"100%"><tbo=
  dy><tr><td style=3D"vertical-align:middle;padding-top:0;padding-right:0;pad=
  ding-bottom:0;padding-left:0;"><table border=3D"0" cellpadding=3D"0" cellsp=
  acing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><td align=3D"ce=
  nter" class=3D"pad-4-lr pad-2-tb text-align-center" style=3D"font-size:0px;=
  padding:10px 25px;padding-top:20px;padding-right:20px;padding-bottom:20px;p=
  adding-left:40px;word-break:break-word;"><div style=3D"font-family:Helvetic=
  a, Arial, Roboto, sans-serif;font-size:15px;font-weight:400;line-height:22p=
  x;text-align:center;color:#000000;"><a href=3D"https://www.americanexpress.=
  com/Tracking=3Fmid=3DIUCOM030202401171200114143016380&msrc=3DENG-ALERTS&url=
  =3Dhttps://www.americanexpress.com/it-it/chi-siamo/legal/centro-di-privacy/=
  dichiarazione-sulla-privacy/=3Finav=3Dit_legalfooter_security" style=3D"col=
  or:#006fcf;align:center;text-decoration:none">Informativa sulla Privacy</a>=
  </div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso=
   | IE]></td><td class=3D"text-align-center-outlook nav-bar-border-b-outlook=
  " style=3D"vertical-align:middle;width:204.6px;" ><![endif]--><div class=3D=
  "mj-column-per-33 mj-outlook-group-fix text-align-center nav-bar-border-b" =
  style=3D"font-size:0px;text-align:left;direction:ltr;display:inline-block;v=
  ertical-align:middle;width:100%;"><table border=3D"0" cellpadding=3D"0" cel=
  lspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><td style=3D=
  "vertical-align:middle;padding-top:0;padding-right:0;padding-bottom:0;paddi=
  ng-left:0;"><table border=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D=
  "presentation" width=3D"100%"><tbody><tr><td align=3D"center" class=3D"pad-=
  4-lr pad-2-tb text-align-center" style=3D"font-size:0px;padding:10px 25px;p=
  adding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px;wo=
  rd-break:break-word;"><div style=3D"font-family:Helvetica, Arial, Roboto, s=
  ans-serif;font-size:15px;font-weight:400;line-height:22px;text-align:center=
  ;color:#000000;"><a href=3D"https://www.americanexpress.com/Tracking=3Fmid=
  =3DIUCOM030202401171200114143016380&msrc=3DENG-ALERTS&url=3Dhttps://www.ame=
  ricanexpress.com/it-it/assistenza/servizio-clienti/contatti/index.html=3Fpa=
  ge=3DCM&inav=3Dit_utility_contact" style=3D"color:#006fcf;align:center;text=
  -decoration:none">Contattaci</a></div></td></tr></tbody></table></td></tr><=
  /tbody></table></div><!--[if mso | IE]></td><td class=3D"text-align-center-=
  outlook nav-bar-border-b-outlook" style=3D"vertical-align:middle;width:210.=
  8px;" ><![endif]--><div class=3D"mj-column-per-34 mj-outlook-group-fix text=
  -align-center nav-bar-border-b" style=3D"font-size:0px;text-align:left;dire=
  ction:ltr;display:inline-block;vertical-align:middle;width:100%;"><table bo=
  rder=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=
  =3D"100%"><tbody><tr><td style=3D"vertical-align:middle;padding-top:0;paddi=
  ng-right:0;padding-bottom:0;padding-left:0;"><table border=3D"0" cellpaddin=
  g=3D"0" cellspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><=
  td align=3D"center" class=3D"pad-4-lr pad-2-tb text-align-center" style=3D"=
  font-size:0px;padding:10px 25px;padding-top:20px;padding-right:20px;padding=
  -bottom:20px;padding-left:20px;word-break:break-word;"><div style=3D"font-f=
  amily:Helvetica, Arial, Roboto, sans-serif;font-size:15px;font-weight:400;l=
  ine-height:22px;text-align:center;color:#000000;"><a href=3D"https://www.am=
  ericanexpress.com/Tracking=3Fmid=3DIUCOM030202401171200114143016380&msrc=3D=
  ENG-ALERTS&url=3Dhttps://www.americanexpress.com/it-it/account/login=3FDest=
  Page=3Dhttps%3A%2F%2Fonline.americanexpress.com%2Fmyca%2Faccountprofile%2Fu=
  s%2Fview.do%3Frequest_type%3Dauthreg_spa%26Face%3Den_US%26s_email%3D%26sour=
  ce%3Dinav%26sorted_index%3D0" style=3D"color:#006fcf;align:center;text-deco=
  ration:none">Smetti di ricevere questi avvisi</a></div></td></tr></tbody></=
  table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><=
  ![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></ta=
  ble></td></tr><tr><td class=3D"" width=3D"620px" ><table align=3D"center" b=
  order=3D"0" cellpadding=3D"0" cellspacing=3D"0" class=3D"" role=3D"presenta=
  tion" style=3D"width:620px;" width=3D"620" bgcolor=3D"#d9d9d6" ><tr><td sty=
  le=3D"line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif=
  ]--><div style=3D"background:#d9d9d6;background-color:#d9d9d6;margin:0px au=
  to;max-width:620px;"><table align=3D"center" border=3D"0" cellpadding=3D"0"=
   cellspacing=3D"0" role=3D"presentation" style=3D"background:#d9d9d6;backgr=
  ound-color:#d9d9d6;width:100%;"><tbody><tr><td style=3D"direction:ltr;font-=
  size:0px;padding:20px 0;padding-bottom:10px;padding-left:0;padding-right:0;=
  padding-top:10px;text-align:center;"><!--[if mso | IE]><table role=3D"prese=
  ntation" border=3D"0" cellpadding=3D"0" cellspacing=3D"0"><tr><td class=3D"=
  " style=3D"vertical-align:top;width:620px;" ><![endif]--><div class=3D"mj-c=
  olumn-per-100 mj-outlook-group-fix" style=3D"font-size:0px;text-align:left;=
  direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table b=
  order=3D"0" cellpadding=3D"0" cellspacing=3D"0" role=3D"presentation" width=
  =3D"100%"><tbody><tr><td style=3D"vertical-align:top;padding-top:0;padding-=
  right:0;padding-bottom:0;padding-left:0;"><table border=3D"0" cellpadding=3D=
  "0" cellspacing=3D"0" role=3D"presentation" width=3D"100%"><tbody><tr><td a=
  lign=3D"left" style=3D"font-size:0px;padding:10px 25px;padding-top:0;paddin=
  g-right:0;padding-bottom:10px;padding-left:0;word-break:break-word;"><div s=
  tyle=3D"font-family:&quot;Helvetica Neue&quot;, Roboto, Helvetica, sans-ser=
  if;font-size:13px;font-weight:400;line-height:20px;text-align:left;color:#5=
  3565a;"><p style=3D"margin:0 0 0 0px">Attenzione: Questa mail =C3=A8 una co=
  municazione di servizio e non una comunicazione contenente offerte promozio=
  nali. Non utilizzare l=C2=B4indirizzo di posta elettronica con cui =C3=A8 s=
  tato inviato il presente email per richiedere informazioni o formulare ques=
  iti. Non verr=C3=A0 dato alcun seguito alle email ricevute che saranno imme=
  diatamente cancellate.</p></div></td></tr><tr><td align=3D"left" style=3D"f=
  ont-size:0px;padding:10px 25px;padding-top:0;padding-right:0;padding-bottom=
  :0;padding-left:0;word-break:break-word;"><div style=3D"font-family:&quot;H=
  elvetica Neue&quot;, Roboto, Helvetica, sans-serif;font-size:13px;font-weig=
  ht:400;line-height:20px;text-align:left;color:#53565a;"><p style=3D"margin:=
  0 0 0 0px">Dichiarazione sulla privacy. <a href=3D"https://www.americanexpr=
  ess.com/Tracking=3Fmid=3DIUCOM030202401171200114143016380&msrc=3DENG-ALERTS=
  &url=3Dhttps%3A%2F%2Fwww.americanexpress.com%2Fitaly%2Fpersonalcards%2Fterm=
  s_conditions.shtml" style=3D"color:#53565a;font-family:&quot;Helvetica Neue=
  &quot;, Roboto, Helvetica, sans-serif;font-size:13px;font-weight:400;line-h=
  eight:20px;text-decoration:underline">Clicca qui </a>per maggiori dettagli =
  sulle pratiche relative alle comunicazioni via e-mail, e per consultare la =
  Dichiarazione sulla privacy di American Express.</p><p style=3D"margin:0 0 =
  0 0px">=C2=A0</p><p style=3D"margin:0 0 0 0px">Questa email =C3=A8 stata in=
  viata a alishadman955@gmail.com</p><p style=3D"margin:0 0 0 0px">=C2=A0</p>=
  <p style=3D"margin:0 0 0 0px">=C2=A92024 American Express Company. All righ=
  ts reserved.</p></div></td></tr><tr><td align=3D"left" style=3D"font-size:0=
  px;padding:10px 25px;padding-top:10px;padding-right:0;padding-bottom:0;padd=
  ing-left:0;word-break:break-word;"><div style=3D"font-family:&quot;Helvetic=
  a Neue&quot;, Roboto, Helvetica, sans-serif;font-size:13px;font-weight:400;=
  line-height:20px;text-align:left;color:#53565a;"><p style=3D"margin:0 0 0 0=
  px">INTUNALE0020007</p><p style=3D"margin:0 0 0 0px">SAM0FYI023</p></div></=
  td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]><=
  /td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | =
  IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></tab=
  le></div><!--[if mso | IE]></td></tr></table><![endif]--></div></body></htm=
  l>`;

  const $ = cheerio.load(body);

  // Extract the body content
  const cheerioedBody = $('p').text();

  console.log('cheerioedBody', cheerioedBody);

  const decodedBody = qp.decode(cheerioedBody);

  console.log('decodedBody', decodedBody);

  const finalBody = decodedBody
    .replace(
      'Informazioni importanti sul tuo accountTITOLAREUltime   6 cifre della Carta: 221006Conferma OperazioneTi confermiamo che Ã¨ stata eseguita su Carta di Credi  to Oro American ExpressÂ® una operazione superiore allâimporto   di 1,00 EUR da te impostato per la notifica.Â Dettagli operazione:',
      '',
    )
    .replace(
      'EURAttenzione: Questa mail Ã¨ una co  municazione di servizio e non una comunicazione contenente offerte promozio  nali. Non utilizzare lÂ´indirizzo di posta elettronica con cui Ã¨ s  tato inviato il presente email per richiedere informazioni o formulare ques  iti. Non verrÃ  dato alcun seguito alle email ricevute che saranno imme  diatamente cancellate.Dichiarazione sulla privacy. Clicca qui per maggiori dettagli   sulle pratiche relative alle comunicazioni via e-mail, e per consultare la   Dichiarazione sulla privacy di American Express.Â Questa email Ã¨ stata in  viata a alishadman955@gmail.comÂ Â©2024 American Express Company. All righ  ts reserved.INTUNALE0020007SAM0FYI023',
      '',
    )
    .replaceAll(' ', '');

  // Regular expression to capture the operation details, the import number and the currency
  const pattern = /(\d{1,2}\/\d{1,2}\/\d{4})([A-Za-z]+)(\d+,\d{2})/;
  const match = finalBody.match(pattern);

  console.log('finalBody', finalBody);
  console.log('match', match);

  if (match) {
    var date = match[1];
    var payee = match[2];
    var amount = match[3];

    console.log('date', date);
    console.log('payee', payee);
    console.log('amount', amount);

    const categorizedPayee = categorize(payee);

    if (categorizedPayee) {
      await postTransaction('amex', amount, categorizedPayee);
    }
  } else {
    console.log('Match not found in the text.');
  }
}

function openInbox(cb) {
  imap.openBox(process.env.INBOX, true, cb);
}
const runImap = () => {
  console.log('Ready to receive emails!!!');

  imap.once('ready', function () {
    openInbox(function (err, box) {
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
            await checkIntesa(headers, body);
            if (process.env.AMEX_ENABLED === 'true') {
              await checkAmex(headers, body);
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
