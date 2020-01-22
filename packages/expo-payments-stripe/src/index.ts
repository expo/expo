module.exports = {
  get PaymentsStripe() {
    return require('./Stripe').default;
  },
};
