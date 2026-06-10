import { DevToolsPlugin } from '../../server/DevToolsPlugin';
import { getDevToolsPluginWebpageBannerItems } from '../interactiveActions';

const DEFAULT_SERVER_URL = 'http://localhost:8081';
const DEFAULT_PROJECT_ROOT = '/path/to/project';

describe(getDevToolsPluginWebpageBannerItems, () => {
  it('returns banner items for opted-in webpage plugins only', () => {
    const visiblePlugin = new DevToolsPlugin(
      {
        packageName: 'visible-plugin',
        packageRoot: '/path/to/visible-plugin',
        webpageRoot: '/path/to/visible-plugin/web',
        webpageBanner: true,
      },
      DEFAULT_PROJECT_ROOT
    );
    const hiddenPlugin = new DevToolsPlugin(
      {
        packageName: 'hidden-plugin',
        packageRoot: '/path/to/hidden-plugin',
        webpageRoot: '/path/to/hidden-plugin/web',
      },
      DEFAULT_PROJECT_ROOT
    );
    const cliOnlyPlugin = new DevToolsPlugin(
      {
        packageName: 'cli-plugin',
        packageRoot: '/path/to/cli-plugin',
        webpageBanner: true,
        cliExtensions: {
          description: 'CLI only',
          entryPoint: 'index.js',
          commands: [{ name: 'run', title: 'Run', environments: ['cli'] }],
        },
      },
      DEFAULT_PROJECT_ROOT
    );

    expect(
      getDevToolsPluginWebpageBannerItems(
        [visiblePlugin, hiddenPlugin, cliOnlyPlugin],
        DEFAULT_SERVER_URL
      )
    ).toEqual([
      {
        packageName: 'visible-plugin',
        url: 'http://localhost:8081/_expo/plugins/visible-plugin',
      },
    ]);
  });
});
