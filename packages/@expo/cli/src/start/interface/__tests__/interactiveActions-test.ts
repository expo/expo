import { DevToolsPlugin } from '../../server/DevToolsPlugin';
import { getDevToolsPluginCliBannerItems } from '../interactiveActions';

const DEFAULT_SERVER_URL = 'http://localhost:8081';
const DEFAULT_PROJECT_ROOT = '/path/to/project';

describe(getDevToolsPluginCliBannerItems, () => {
  it('returns banner items for webpage plugins with bannerTitle only', () => {
    const visiblePlugin = new DevToolsPlugin(
      {
        packageName: 'visible-plugin',
        packageRoot: '/path/to/visible-plugin',
        webpageRoot: '/path/to/visible-plugin/web',
        bannerTitle: 'Visible Plugin',
      },
      DEFAULT_PROJECT_ROOT
    );
    const packageTitlePlugin = new DevToolsPlugin(
      {
        packageName: 'package-title-plugin',
        packageRoot: '/path/to/package-title-plugin',
        webpageRoot: '/path/to/package-title-plugin/web',
        bannerTitle: true,
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
        bannerTitle: true,
        cliExtensions: {
          description: 'CLI only',
          entryPoint: 'index.js',
          commands: [{ name: 'run', title: 'Run', environments: ['cli'] }],
        },
      },
      DEFAULT_PROJECT_ROOT
    );

    expect(
      getDevToolsPluginCliBannerItems(
        [visiblePlugin, packageTitlePlugin, hiddenPlugin, cliOnlyPlugin],
        DEFAULT_SERVER_URL
      )
    ).toEqual([
      {
        title: 'Visible Plugin',
        url: 'http://localhost:8081/_expo/plugins/visible-plugin',
      },
      {
        title: 'package-title-plugin',
        url: 'http://localhost:8081/_expo/plugins/package-title-plugin',
      },
    ]);
  });
});
