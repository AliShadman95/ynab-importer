import ynab, { utils } from 'ynab';
import { logWithTimestamp } from '../utils/logger.js';

const ynabAPI = new ynab.API(process.env.YNAB_TOKEN);

const postTransaction = async (account, price, categorizedPayee) => {
  const isMartina = process.env.ENV_TYPE === 'marti';

  const {
    data: { budgets },
  } = await ynabAPI.budgets.getBudgets();

  const budgetId = budgets.find((budget) =>
    budget?.name?.toLowerCase()?.includes(isMartina ? 'martina' : 'ali'),
  )?.id;

  const {
    data: { accounts },
  } = await ynabAPI.accounts.getAccounts(budgetId);

  const {
    data: { category_groups },
  } = await ynabAPI.categories.getCategories(budgetId);

  const correctCategoryGroup =
    category_groups.find((cg) =>
      cg.categories.some((c) =>
        c.name.toLowerCase().includes(categorizedPayee.category),
      ),
    ) ||
    category_groups.find((cg) =>
      cg.categories.some((c) =>
        c.name.toLowerCase().includes('spese generiche'),
      ),
    );

  const getTransactionInfo = (account) => {
    switch (account) {
      case 'intesa':
        return {
          price: isMartina
            ? parseFloat(price.replace(/,/g, '.')) * 1000
            : Math.ceil(parseFloat(price.replace(/,/g, '.'))) * 1000,
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

      case 'amex-plat':
        return {
          price: parseFloat(price.replace(/,/g, '.')) * 1000,
          account_id: accounts.find((account) =>
            account.name?.toLowerCase().includes('amex platino'),
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

  try {
    await ynabAPI.transactions.createTransaction(budgetId, {
      transaction: {
        amount: -Math.abs(transactionInfo?.price),
        payee_name: categorizedPayee.payee_name?.trimEnd(),
        category_id:
          correctCategoryGroup?.categories?.find((c) =>
            c.name.toLowerCase().includes(categorizedPayee.category),
          )?.id ||
          correctCategoryGroup?.categories?.find((c) =>
            c.name.toLowerCase().includes('spese generiche'),
          )?.id,
        approved: false,
        flag_color: 'green',
        account_id: transactionInfo?.account_id,
        date: utils.getCurrentDateInISOFormat(),
      },
    });

    logWithTimestamp(
      `Successfully added transaction for ${account} with price ${price} and payee ${categorizedPayee.payee_name}`,
    );
  } catch (error) {
    logWithTimestamp('Error while trying to post on YNAB', error);
  }
};

export { postTransaction };
export default postTransaction;
