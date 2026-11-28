import type { ConfigT } from '@expo/metro/metro-config';
import FailedToResolveNameError from '@expo/metro/metro-resolver/errors/FailedToResolveNameError';
import FailedToResolvePathError from '@expo/metro/metro-resolver/errors/FailedToResolvePathError';

import { withMetroResolvers } from '../withMetroResolvers';

const asMetroConfig = (config: Partial<ConfigT>): ConfigT => config as any;

describe(withMetroResolvers, () => {
  it(`falls back to the default resolver if the custom resolver doesn't return a result`, () => {
    const customResolver1 = jest.fn(() => {
      throw new FailedToResolveNameError(['/'], ['/']);
    });
    const customResolver2 = jest.fn(() => {
      const mockCandidate = {
        type: 'asset',
        name: 'foobar',
      } as const;
      throw new FailedToResolvePathError({ dir: mockCandidate, file: mockCandidate });
    });
    const customResolver3 = jest.fn(() => {
      return null;
    });
    const originalResolveRequest = jest.fn((context, ...props) =>
      context.resolveRequest(context, ...props)
    );
    const modified = withMetroResolvers(
      asMetroConfig({
        projectRoot: '/',
        // @ts-expect-error
        resolver: {
          resolveRequest: originalResolveRequest,
        },
      }),
      [customResolver1, customResolver2, customResolver3]
    );

    modified.resolver.resolveRequest!(
      // @ts-expect-error: invalid types on resolveRequest
      {
        resolveRequest: jest.fn(),
      },
      'react-native',
      'ios'
    );

    // Throws a FailedToResolveNameError
    expect(customResolver1).toHaveBeenCalledTimes(1);
    // Throws a FailedToResolvePathError
    expect(customResolver2).toHaveBeenCalledTimes(1);
    // Returns null
    expect(customResolver3).toHaveBeenCalledTimes(1);
    // Falls back to the original resolver
    expect(originalResolveRequest).toHaveBeenCalledTimes(1);
  });

  it(`skips extra resolvers when the custom resolver fails to extend correctly`, () => {
    const customResolver1 = jest.fn(() => {
      return {} as any;
    });

    const originalResolveRequest = jest.fn();
    const modified = withMetroResolvers(
      asMetroConfig({
        projectRoot: '/',
        // @ts-expect-error
        resolver: {
          resolveRequest: originalResolveRequest,
        },
      }),
      [customResolver1]
    );

    // @ts-expect-error: invalid types on resolveRequest
    modified.resolver.resolveRequest!({}, 'react-native', 'ios');

    expect(customResolver1).toHaveBeenCalledTimes(0);
    expect(originalResolveRequest).toHaveBeenCalled();
  });

  it(`chains resolvers`, () => {
    const customResolver1 = jest.fn(() => {
      return {} as any;
    });

    const originalResolveRequest = jest.fn((context, ...props) =>
      context.resolveRequest(context, ...props)
    );
    const modified = withMetroResolvers(
      asMetroConfig({
        projectRoot: '/',
        // @ts-expect-error
        resolver: {
          resolveRequest: originalResolveRequest,
        },
      }),
      [customResolver1]
    );

    // @ts-expect-error: invalid types on resolveRequest
    modified.resolver.resolveRequest!({}, 'react-native', 'ios');

    // Resolves
    expect(customResolver1).toHaveBeenCalledTimes(1);
    // Never called
    expect(originalResolveRequest).toHaveBeenCalledTimes(1);
  });
  it(`disables native extensions for all web resolvers regardless of if web is enabled`, () => {
    const customResolver1 = jest.fn(() => {
      return {} as any;
    });

    const originalResolveRequest = jest.fn((context, ...props) =>
      context.resolveRequest(context, ...props)
    );
    const modified = withMetroResolvers(
      asMetroConfig({
        projectRoot: '/',
        // @ts-expect-error
        resolver: {
          resolveRequest: originalResolveRequest,
        },
      }),
      [customResolver1]
    );

    // @ts-expect-error: invalid types on resolveRequest
    modified.resolver.resolveRequest!({}, 'react-native', 'web');

    // Resolves
    expect(customResolver1).toHaveBeenCalledTimes(1);
    expect(customResolver1).toHaveBeenCalledWith(
      expect.objectContaining({ resolveRequest: expect.anything() }),
      'react-native',
      'web'
    );
  });

  it(`gives custom resolvers the context helpers that Metro 0.88 removed`, () => {
    let userContext: any;
    const modified = withMetroResolvers(
      asMetroConfig({
        projectRoot: '/',
        // @ts-expect-error
        resolver: {
          resolveRequest(context) {
            userContext = context;
            return { type: 'empty' };
          },
        },
      }),
      []
    );

    modified.resolver.resolveRequest!(
      // @ts-expect-error: a partial context
      {
        originModulePath: '/app/index.js',
        mainFields: ['browser', 'main'],
        getPackageForModule: () => ({
          packageJson: { name: 'app', browser: { fs: false } },
          rootPath: '/app',
          packageRelativePath: 'index.js',
        }),
        fileSystemLookup: (filePath: string) =>
          filePath === '/app/index.js'
            ? { exists: true, type: 'f', realPath: filePath }
            : filePath === '/app/lib'
              ? { exists: true, type: 'd', realPath: filePath }
              : { exists: false },
        resolveRequest: jest.fn(),
      },
      'fs',
      'web'
    );

    expect(userContext.redirectModulePath('fs')).toBe(false);
    expect(userContext.redirectModulePath('path')).toBe('path');
    expect(userContext.doesFileExist('/app/index.js')).toBe(true);
    expect(userContext.doesFileExist('/app/lib')).toBe(false);
    expect(userContext.doesFileExist('/app/missing.js')).toBe(false);
  });
});
