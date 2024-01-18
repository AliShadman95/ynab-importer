import _ from './env.js';
import { runImap } from './functions/imap.js';
import { imap, imapAmex } from './core/imap.js';

runImap(imap);
runImap(imapAmex);
