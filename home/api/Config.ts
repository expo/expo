const host = 'exp.host';
// const host = 'staging.exp.host';
// const host = 'localhost:3000';
//const host = 'ed56a018.ngrok.io';
const origin = `https://${host}`;
// const origin = 'http://localhost:3000';
const websiteOrigin = 'https://expo.dev';
// const websiteOrigin = 'http://localhost:3001';

export default {
  api: {
    host,
    origin,
  },
  website: {
    origin: websiteOrigin,
  },
};
