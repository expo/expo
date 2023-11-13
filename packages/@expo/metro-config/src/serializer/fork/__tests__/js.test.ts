import { getExportPathForDependency } from '../js';

describe(getExportPathForDependency, () => {
  it(`returns consistent local path`, () => {
    expect(
      getExportPathForDependency(
        {
          absolutePath:
            '/Users/evanbacon/Documents/GitHub/expo-router/apps/sandbox/etc/external.tsx',
          data: {
            name: './etc/external',
            data: {
              asyncType: 'async',
              locs: [
                {
                  start: { line: 6, column: 14, index: 104 },
                  end: { line: 6, column: 38, index: 128 },
                },
              ],
              key: 'ABce1CIQXn2ftjEvEp/O1fQ9SzE=',
            },
          },
        }.absolutePath,
        {
          dev: false,
          includeAsyncPaths: true,
          projectRoot: '/Users/evanbacon/Documents/GitHub/expo-router/apps/sandbox',
          serverRoot: '/Users/evanbacon/Documents/GitHub/expo-router/apps/sandbox',
          sourceUrl:
            'http://localhost:8081/index.bundle//&platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static',
        }
      )
    ).toBe('/_expo/static/js/web/external-4df81b27e74f4b9adcab7bc5a479cb7a.js');
  });
});
