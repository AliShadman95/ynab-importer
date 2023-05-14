const categorize = (payee) => {
  const amazon = ['amz', 'amazon'];
  const asporto = ['justeatital', 'glovo', 'deliveroo'];
  const supermercati = [
    'coop',
    'conad',
    'carrefour',
    'lidl',
    'eurospin',
    'getir',
    'crf',
  ];
  const ristoranti = ['ristorante', 'la piadineria', "mcdonald's"];
  const notValid = [
    'ovh',
    'amazon prime',
    'dazn',
    'pag.finanziamento rateale',
    'iliad',
    'apple',
    'prelievo',
  ];

  if (notValid.some((word) => payee.toLowerCase().includes(word))) {
    return false;
  }
  if (payee.toLowerCase().includes('farmacia')) {
    return { payee_name: 'Medicine', category: 'salute/medico' };
  }
  if (payee.toLowerCase().includes('atac')) {
    return { payee_name: 'Atac', category: 'trasporti' };
  }
  if (amazon.some((word) => payee.toLowerCase().includes(word))) {
    return { payee_name: 'Amazon', category: 'amazon' };
  }
  if (ristoranti.some((word) => payee.toLowerCase().includes(word))) {
    return { payee_name: 'Ristorante', category: 'mangiare fuori/asporto' };
  }
  if (asporto.some((word) => payee.toLowerCase().includes(word))) {
    return { payee_name: 'Asporto', category: 'mangiare fuori/asporto' };
  }
  if (supermercati.some((word) => payee.toLowerCase().includes(word))) {
    return { payee_name: 'Supermercati', category: 'spesa' };
  }

  if (payee.toLowerCase().includes('paypal')) {
    return { payee_name: 'Paypal', category: 'spese generiche' };
  }

  return { payee_name: payee, category: 'spese generiche' };
};

export { categorize };
export default categorize;
