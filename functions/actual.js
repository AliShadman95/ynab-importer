import api from '@actual-app/api';
import { format } from 'date-fns';
import { logWithTimestamp } from '../utils/logger.js';

const postTransaction = async (account, price, categorizedPayee) => {
  const isMartina = process.env.ENV_TYPE === 'marti';

  await api.init({
    dataDir: '/tmp',
    serverURL: 'https://budget.alishd.app',
    password: process.env.ACTUAL_PASS,
  });

  isMartina
    ? await api.downloadBudget('5a0116b1-f3ff-4274-bbb4-5e1f96a1bb6b')
    : await api.downloadBudget('ddf1da68-b340-4e93-a94f-6a3831f5d9a6', {
        password: process.env.ACTUAL_E2E,
      });

  const categories = await api.getCategories();
  const accounts = await api.getAccounts();

  const getTransactionInfo = (account) => {
    switch (account) {
      case 'intesa':
        return {
          price: isMartina
            ? parseFloat(price.replace(/,/g, '.')) * 100
            : Math.ceil(parseFloat(price.replace(/,/g, '.'))) * 100,
          account_id: accounts.find((account) =>
            account.name?.toLowerCase().includes('intesa'),
          ).id,
        };

      case 'amex':
        return {
          price: Math.round(parseFloat(price.replace(/,/g, '.')) * 100),
          account_id: accounts.find((account) =>
            account.name?.toLowerCase().includes('amex'),
          ).id,
        };

      case 'mastercard':
        return {
          price: parseFloat(price.replace(/,/g, '.')) * 100,
          account_id: accounts.find((account) =>
            account.name?.toLowerCase().includes('mastercard'),
          ).id,
        };

      default:
        break;
    }
  };

  const transactionInfo = getTransactionInfo(account);

  console.log(transactionInfo.price);

  try {
    await api.addTransactions(
      transactionInfo.account_id,
      [
        {
          date: `${format(new Date(), 'yyyy-MM-dd')}`,
          payee_name: categorizedPayee.payee_name?.trimEnd(),
          amount: -Math.abs(transactionInfo?.price),
          category: categories.find((c) =>
            c.name.toLowerCase().includes(categorizedPayee.category),
          )?.id,
          cleared: false,
        },
      ],
      { learnCategories: true },
    );

    await api.shutdown();

    logWithTimestamp(
      `Successfully added transaction for ${account} with price ${price} and payee ${categorizedPayee.payee_name}`,
    );
  } catch (error) {
    logWithTimestamp('Error while trying to post on Actual', error);
  }
};

export { postTransaction };
export default postTransaction;
