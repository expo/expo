const configs = require('./tools/configs');
const lintFixtures = require('./tools/lintFixtures');

describe.each(configs)('$name config', (config) => {
  it('lints the rule fixtures', async () => {
    for (const { filePath, messages } of await lintFixtures(config, 'fixtures/rule-*')) {
      expect(messages).toMatchSnapshot(filePath);
    }
  });
});
