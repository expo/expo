import { MetroBundlerDevServer } from '../MetroBundlerDevServer';

it(`starts dev server`, async () => {
  const projectRoot = '/';
  const exp = {} as any;
  const devClient = false;
  const devServer = new MetroBundlerDevServer(projectRoot, exp, devClient);

  await devServer.startAsync({
    // ...
  });
});

// runMetroDevServerAsync
// startAsync
