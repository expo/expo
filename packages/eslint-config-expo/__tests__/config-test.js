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
