import ynab, { utils } from 'ynab';

const ynabAPI = new ynab.API(process.env.YNAB_TOKEN);

const postTransaction = async (account, price, categorizedPayee) => {
  const {
    data: { accounts },
  } = await ynabAPI.accounts.getAccounts('last-used');

  const {
    data: { category_groups },
  } = await ynabAPI.categories.getCategories('last-used');

  const correctCategory = category_groups.find((cg) =>
    cg.categories.some((c) =>
      c.name.toLowerCase().includes(categorizedPayee.category),
    ),
  );

  const getTransactionInfo = (account) => {
    switch (account) {
      case 'intesa':
        return {
          price: Math.ceil(parseFloat(price.replace(/,/g, '.'))) * 1000,
          account_id: accounts.find((account) =>
            account.name?.toLowerCase().includes('intesa'),
          ).id,
        };

      case 'amex':
        return {
          price: parseFloat(price.replace(/,/g, '.')) * 1000,
          account_id: accounts.find((account) =>
            account.name?.toLowerCase().includes('amex'),
          ).id,
        };

      case 'mastercard':
        return {
          price: parseFloat(price.replace(/,/g, '.')) * 1000,
          account_id: accounts.find((account) =>
            account.name?.toLowerCase().includes('mastercard'),
          ).id,
        };

      default:
        break;
    }
  };

  const transactionInfo = getTransactionInfo(account);

  await ynabAPI.transactions.createTransaction('last-used', {
    transaction: {
      amount: -Math.abs(transactionInfo?.price),
      payee_name: categorizedPayee.payee_name,
      category_id: correctCategory.categories.find((c) =>
        c.name.toLowerCase().includes(categorizedPayee.category),
      ).id,
      approved: false,
      flag_color: 'green',
      account_id: transactionInfo?.account_id,
      date: utils.getCurrentDateInISOFormat(),
    },
  });
};

export { postTransaction };
export default postTransaction;
