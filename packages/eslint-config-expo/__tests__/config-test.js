const configs = require('./tools/configs');
const { normalizeConfig } = require('./tools/normalizeConfig');

const sampleFiles = [
  'src/app.js',
  'src/app.jsx',
  'src/app.ts',
  'src/app.tsx',
  'src/app.ios.ts',
  'src/app.web.js',
  'src/types.d.ts',
  'src/lib.cjs',
  'src/lib.mjs',
  'metro.config.js',
];

describe.each(configs)('$name config', ({ ESLint, options }) => {
  const eslint = new ESLint(options);

  it.each(sampleFiles)('resolves %s', async (file) => {
    const config = await eslint.calculateConfigForFile(file);
    expect(normalizeConfig(config)).toMatchSnapshot();
  });

  it('ignores Android build intermediates', async () => {
    expect(await eslint.isPathIgnored('android/app/build/intermediates/x.js')).toBe(true);
    expect(await eslint.isPathIgnored('src/app.js')).toBe(false);
  });
});

describe('legacy and flat config', () => {
  const [legacy, flat] = configs.map(({ ESLint, options }) => new ESLint(options));

  // ESLint 8 fills in the schema defaults of each rule's options and ESLint 9 does not, so only
  // the severities are compared here; the snapshots above cover the options per entry point.
  const severities = (config) =>
    Object.fromEntries(
      Object.entries(normalizeConfig(config).rules).map(([rule, [severity]]) => [rule, severity])
    );

  it.each(sampleFiles)('enable the same rules for %s', async (file) => {
    const [legacyConfig, flatConfig] = await Promise.all([
      legacy.calculateConfigForFile(file),
      flat.calculateConfigForFile(file),
    ]);
    expect(severities(legacyConfig)).toEqual(severities(flatConfig));
  });
});
