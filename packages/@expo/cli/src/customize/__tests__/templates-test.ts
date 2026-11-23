import { selectTemplatesAsync } from '../templates';

jest.mock('../../utils/interactive', () => ({ isInteractive: () => false }));

it('names the file arguments in non-interactive mode', async () => {
  await expect(
    selectTemplatesAsync('/', { webStaticPath: 'public', appDirPath: 'app' })
  ).rejects.toThrow(
    'files: arguments must be provided in non-interactive mode. Valid choices are: babel.config.js, metro.config.js, tsconfig.json, .eslintrc.js (deprecated), eslint.config.js, public/index.html, webpack.config.js, app/+html.tsx, app/+native-intent.ts'
  );
});
