import { getFilesToExportFromServerAsync } from '../exportStaticAsync';

describe(getFilesToExportFromServerAsync, () => {
  it(`should export from server async`, async () => {
    const renderAsync = jest.fn(async () => ({
      fetchData: false,
      scriptContents: 'foo',
      renderAsync: () => '',
    }));

    expect(
      await getFilesToExportFromServerAsync({
        manifest: {
          initialRouteName: undefined,
          screens: {
            '(app)': {
              path: '(app)',
              screens: { compose: 'compose', index: '', 'note/[note]': 'note/:note' },
              initialRouteName: 'index',
            },
            '(auth)/sign-in': '(auth)/sign-in',
            _sitemap: '_sitemap',
            '[...404]': '*404',
          },
        },
        renderAsync,
        scripts: ['bar'],
      })
    ).toEqual(
      new Map([
        ['(auth)/sign-in.html', ''],
        ['sign-in.html', ''],
        ['[...404].html', ''],
        ['_sitemap.html', ''],
        ['compose.html', ''],
        ['index.html', ''],
        ['note/[note].html', ''],
      ])
    );
  });
});
