import ynab, { utils } from 'ynab';

const ynabAPI = new ynab.API(process.env.YNAB_TOKEN);

const postTransaction = async (isCC, price, categorizedPayee) => {
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

  await ynabAPI.transactions.createTransaction('last-used', {
    transaction: {
      amount: -Math.abs(parseFloat(price.replace(/,/g, '.')) * 1000),
      payee_name: categorizedPayee.payee_name,
      category_id: correctCategory.categories.find((c) =>
        c.name.toLowerCase().includes(categorizedPayee.category),
      ).id,
      approved: false,
      flag_color: 'green',
      account_id: accounts.find((account) =>
        isCC ? account.type === 'creditCard' : account.type === 'savings',
      ).id,
      date: utils.getCurrentDateInISOFormat(),
    },
  });
};

export { postTransaction };
export default postTransaction;
