const detox = require('detox');
const config = require('../package.json').detox;

beforeEach(async () => {
  await detox.init(config);
  // needs to be called before any usage of firestore
  await firebase.firestore().settings({ persistence: true });
  await firebase.firestore().settings({ persistence: false });
});

after(async () => {
  console.log('Cleaning up...');
  await TestHelpers.firestore.cleanup();
  await detox.cleanup();
});
