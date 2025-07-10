import { vol } from 'memfs';

import { installAsync } from '../../install/installAsync';
import { copyAsync } from '../../utils/dir';
import { queryAndGenerateAsync, selectAndGenerateAsync } from '../generate';
import { selectTemplatesAsync } from '../templates';

jest.mock('../../log');
jest.mock('../templates', () => {
  const templates = jest.requireActual('../templates');
  return {
    ...templates,
    selectTemplatesAsync: jest.fn(),
  };
});
jest.mock('../../install/installAsync', () => ({ installAsync: jest.fn() }));
jest.mock('../../utils/dir', () => ({ copyAsync: jest.fn() }));

describe(queryAndGenerateAsync, () => {
  it(`asserts an invalid file`, async () => {
    await expect(
      queryAndGenerateAsync('/', {
        files: ['file1', 'file2'],
        props: {
          webStaticPath: 'web',
          appDirPath: 'app',
        },
        extras: [],
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid files: file1, file2. Allowed: babel.config.js, metro.config.js, tsconfig.json, .eslintrc.js (deprecated), eslint.config.js, web/index.html, webpack.config.js, app/+html.tsx, app/+native-intent.ts"`
    );
  });
  it(`does nothing`, async () => {
    await queryAndGenerateAsync('/', {
      files: [],
      props: {
        webStaticPath: 'web',
        appDirPath: 'app',
      },
      extras: ['foobar'],
    });
    expect(copyAsync).not.toHaveBeenCalled();
    expect(installAsync).not.toHaveBeenCalled();
  });
  it(`queries a file, generates, and installs`, async () => {
    await queryAndGenerateAsync('/', {
      files: ['babel.config.js'],
      props: {
        webStaticPath: 'web',
        appDirPath: 'app',
      },
      extras: ['foobar'],
    });
    expect(copyAsync).toHaveBeenCalledWith(
      expect.stringMatching(/@expo\/cli\/static\/template\/babel\.config\.js/),
      '/babel.config.js'
    );
    expect(installAsync).toHaveBeenCalledWith(['babel-preset-expo'], {}, ['--dev', 'foobar']);
  });
});

describe(selectAndGenerateAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`exits when no items are selected`, async () => {
    jest.mocked(selectTemplatesAsync).mockResolvedValue([]);

    await expect(
      selectAndGenerateAsync('/', {
        props: {
          webStaticPath: 'web',
          appDirPath: 'app',
        },
        extras: [],
      })
    ).rejects.toThrow(/EXIT/);

    expect(copyAsync).not.toHaveBeenCalled();
    expect(installAsync).not.toHaveBeenCalled();
  });

  it(`selects a file, generates, and installs`, async () => {
    vol.fromJSON(
      {
        'node_modules/@expo/webpack-config/template/webpack.config.js': '',
      },
      '/'
    );

    jest.mocked(selectTemplatesAsync).mockResolvedValue([6]);

    await selectAndGenerateAsync('/', {
      props: {
        webStaticPath: 'web',
        appDirPath: 'app',
      },
      extras: [],
    });

    expect(copyAsync).toHaveBeenCalledWith(
      expect.stringMatching(/@expo\/webpack-config\/template\/webpack\.config\.js/),
      '/webpack.config.js'
    );
    expect(installAsync).not.toHaveBeenCalled();
  });

  it(`selects a file from installed, and generates`, async () => {
    vol.fromJSON({}, '/');

    jest.mocked(selectTemplatesAsync).mockResolvedValue([6]);

    await selectAndGenerateAsync('/', {
      props: {
        webStaticPath: 'web',
        appDirPath: 'app',
      },
      extras: [],
    });

    // NOTE(EvanBacon): This logic makes no sense anymore.
    // Why install a package after not using the versioned template?
    // This isn't high priority since the file never changes and we should drop Webpack.
    expect(copyAsync).toHaveBeenCalledWith(
      expect.stringMatching(/@expo\/cli\/static\/template\/webpack\.config\.js/),
      '/webpack.config.js'
    );
    expect(installAsync).toHaveBeenCalledWith(['@expo/webpack-config'], {}, ['--dev']);
  });
});
