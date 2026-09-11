import { vol } from 'memfs';

import { resolveInstallAppPathAsync } from '../resolveInstallAppPath';

const props = {
  projectRoot: '/project',
  scheme: 'MyApp',
  xcodeProject: { name: '/project/ios/MyApp.xcodeproj', isWorkspace: false },
};
const schemePath = '/project/ios/MyApp.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme';

function schemeXml(appName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Scheme version="1.3">
  <LaunchAction>
    <BuildableProductRunnable>
      <BuildableReference BuildableName="${appName}"/>
    </BuildableProductRunnable>
  </LaunchAction>
</Scheme>`;
}

afterEach(() => vol.reset());

it('uses the only checked app without requiring a shared scheme', async () => {
  await expect(resolveInstallAppPathAsync(props, ['/built/My App.app'])).resolves.toBe(
    '/built/My App.app'
  );
});

it('selects the scheme runnable instead of the first compiled app', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'])
  ).resolves.toBe('/built/My App.app');
});

it('reads schemes stored in the selected workspace', async () => {
  const workspace = '/project/ios/MyApp.xcworkspace';
  vol.fromJSON({ [`${workspace}/xcshareddata/xcschemes/MyApp.xcscheme`]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: workspace, isWorkspace: true },
      },
      ['/built/Clip.app', '/built/My App.app']
    )
  ).resolves.toBe('/built/My App.app');
});

it('matches scheme names literally, including regex characters', async () => {
  const literalScheme = '/project/ios/MyApp.xcodeproj/xcshareddata/xcschemes/App (dev).xcscheme';
  vol.fromJSON({ [literalScheme]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync({ ...props, scheme: 'App (dev)' }, [
      '/built/Clip.app',
      '/built/My App.app',
    ])
  ).resolves.toBe('/built/My App.app');
});

it('rejects a runnable that is not one of the compiled apps', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('Other.app') });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'])
  ).rejects.toThrow('Cannot select an app to install');
});

it('rejects identical product names in different directories', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/a/My App.app', '/built/b/My App.app'])
  ).rejects.toThrow('Cannot select an app to install');
});

it('ignores same-name schemes in other projects when a project was selected', async () => {
  vol.fromJSON({
    [schemePath]: schemeXml('My App.app'),
    '/project/ios/Other.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme': schemeXml('Other.app'),
  });
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Other.app', '/built/My App.app'])
  ).resolves.toBe('/built/My App.app');
});

it('resolves relative project paths from the project root', async () => {
  vol.fromJSON({ [schemePath]: schemeXml('My App.app') });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: 'ios/MyApp.xcodeproj', isWorkspace: false },
      },
      ['/built/Other.app', '/built/My App.app']
    )
  ).resolves.toBe('/built/My App.app');
});

it.each([
  ['MyApp.xcodeproj', false],
  ['MyApp.xcworkspace', true],
] as const)('reads user schemes from the selected %s', async (container, isWorkspace) => {
  const containerPath = `/project/ios/${container}`;
  vol.fromJSON({
    [`${containerPath}/xcuserdata/test.xcuserdatad/xcschemes/MyApp.xcscheme`]:
      schemeXml('My App.app'),
  });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: containerPath, isWorkspace },
      },
      ['/built/Other.app', '/built/My App.app']
    )
  ).resolves.toBe('/built/My App.app');
});

it('reads project user schemes from a workspace', async () => {
  vol.fromJSON({
    '/project/ios/MyApp.xcodeproj/xcuserdata/test.xcuserdatad/xcschemes/MyApp.xcscheme':
      schemeXml('My App.app'),
  });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: '/project/ios/MyApp.xcworkspace', isWorkspace: true },
      },
      ['/built/Other.app', '/built/My App.app']
    )
  ).resolves.toBe('/built/My App.app');
});

it('reports ambiguity when a workspace has multiple matching scheme definitions', async () => {
  vol.fromJSON({
    [schemePath]: schemeXml('My App.app'),
    '/project/ios/Other.xcodeproj/xcshareddata/xcschemes/MyApp.xcscheme': schemeXml('Other.app'),
  });
  await expect(
    resolveInstallAppPathAsync(
      {
        ...props,
        xcodeProject: { name: '/project/ios/MyApp.xcworkspace', isWorkspace: true },
      },
      ['/built/Other.app', '/built/My App.app']
    )
  ).rejects.toThrow('Cannot select an app to install');
});

it.each(['<Scheme/>', '<Scheme><LaunchAction>', schemeXml('App.framework')])(
  'rejects missing or malformed runnable metadata: %s',
  async (xml) => {
    vol.fromJSON({ [schemePath]: xml });
    await expect(
      resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'])
    ).rejects.toThrow('Cannot select an app to install');
  }
);

it('rejects an absent scheme for multiple artifacts', async () => {
  await expect(
    resolveInstallAppPathAsync(props, ['/built/Clip.app', '/built/My App.app'])
  ).rejects.toThrow('Cannot select an app to install');
});
