import assets from './tests/assets';
import basic from './tests/basic';

// run tests from a single file in order to keep them entirely sequential;
// --runInBand is not enough on its own
describe('Updates e2e', () => {
  basic();
  assets();
});
