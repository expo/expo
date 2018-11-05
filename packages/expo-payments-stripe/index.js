module.exports = {
  get PaymentsStripe() {
    return require('./src/Stripe').default;
  },
};
