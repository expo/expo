import { vol } from 'memfs';

import {
  getAppRouterRelativeEntryPath,
  getApiRoutesForDirectory,
  getMiddlewareForDirectory,
} from '../router';

jest.mock('resolve-from');

afterEach(() => {
  vol.reset();
});

describe(getAppRouterRelativeEntryPath, () => {
  it(`returns undefined when the expo-router package cannot be resolved`, () => {
    vol.fromJSON(
      {
        'node_modules/expo/package.json': '{}',
      },
      '/'
    );

    expect(getAppRouterRelativeEntryPath('/')).toBe('../../app');
  });

  it(`returns the relative path when the file exists`, () => {
    vol.fromJSON(
      {
        'node_modules/expo-router/entry.js': 'export default () => {}',
      },
      '/'
    );
    expect(getAppRouterRelativeEntryPath('/')).toBe('../../app');
  });
  it(`returns the relative path when the file exists in a monorepo`, () => {
    vol.fromJSON(
      {
        'apps/demo/package.json': '{}',
        'package/expo-router/entry.js': 'export default () => {}',
      },
      '/'
    );
    expect(getAppRouterRelativeEntryPath('/apps/demo/')).toBe('../../app');
  });
});

describe(getApiRoutesForDirectory, () => {
  it('returns api routes by glob pattern', () => {
    vol.fromJSON(
      {
        'app/test.tsx': 'export default () => {}',
        'app/test+api.tsx': 'export default () => {}',
        'app/nested/route+api.tsx': 'export default () => {}',
        'app/.well-known/test+api.tsx': 'export default () => {}',
      },
      '/project'
    );
    expect(getApiRoutesForDirectory('/project/app').sort()).toEqual([
      '/project/app/.well-known/test+api.tsx',
      '/project/app/nested/route+api.tsx',
      '/project/app/test+api.tsx',
    ]);
  });
});

describe(getMiddlewareForDirectory, () => {
  it('returns null when no middleware files exist', () => {
    vol.fromJSON(
      {
        'app/test.tsx': 'export default () => {}',
        'app/index.tsx': 'export default () => {}',
      },
      '/project'
    );
    expect(getMiddlewareForDirectory('/project/app')).toBeNull();
  });

  it('returns the middleware file when only one exists', () => {
    vol.fromJSON(
      {
        'app/+middleware.ts': 'export default () => {}',
        'app/index.tsx': 'export default () => {}',
      },
      '/project'
    );
    expect(getMiddlewareForDirectory('/project/app')).toBe('/project/app/+middleware.ts');
  });

  it('returns the middleware file when only one exists', () => {
    vol.fromJSON(
      {
        'app/+middleware.ts': 'export default () => {}',
        'app/index.tsx': 'export default () => {}',
      },
      '/project'
    );
    expect(getMiddlewareForDirectory('/project/app')).toBe('/project/app/+middleware.ts');
  });

  describe('in development', () => {
    let originalEnv: string;
    beforeAll(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
    });
    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('throws an error when multiple middleware files exist in development', () => {
      vol.fromJSON(
        {
          'app/+middleware.ts': 'export default () => {}',
          'app/+middleware.js': 'export default () => {}',
          'app/index.tsx': 'export default () => {}',
        },
        '/project'
      );

      expect(() => getMiddlewareForDirectory('/project/app')).toThrow(
        'Only one middleware file is allowed. Keep one of the conflicting files: "./+middleware.js" or "./+middleware.ts"'
      );
    });

    it('detects conflicts between different extensions', () => {
      vol.fromJSON(
        {
          'app/+middleware.tsx': 'export default () => {}',
          'app/+middleware.jsx': 'export default () => {}',
          'app/index.tsx': 'export default () => {}',
        },
        '/project'
      );

      expect(() => getMiddlewareForDirectory('/project/app')).toThrow(
        'Only one middleware file is allowed. Keep one of the conflicting files: "./+middleware.jsx" or "./+middleware.tsx"'
      );
    });
  });

  describe('in production', () => {
    let originalEnv: string;
    beforeAll(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
    });
    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('returns the first middleware file in production when multiple exist', () => {
      vol.fromJSON(
        {
          'app/+middleware.ts': 'export default () => {}',
          'app/+middleware.js': 'export default () => {}',
          'app/index.tsx': 'export default () => {}',
        },
        '/project'
      );

      const result = getMiddlewareForDirectory('/project/app');
      expect(result).toBeTruthy();
      expect(result).toMatch('/project/app/+middleware.ts');
    });
  });
});
