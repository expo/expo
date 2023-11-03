import { ConfigT } from 'metro-config';
import FailedToResolveNameError from 'metro-resolver/src/errors/FailedToResolveNameError';
import FailedToResolvePathError from 'metro-resolver/src/errors/FailedToResolvePathError';

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
      };
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
    expect(customResolver1).toBeCalledTimes(1);
    // Throws a FailedToResolvePathError
    expect(customResolver2).toBeCalledTimes(1);
    // Returns null
    expect(customResolver3).toBeCalledTimes(1);
    // Falls back to the original resolver
    expect(originalResolveRequest).toBeCalledTimes(1);
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

    expect(customResolver1).toBeCalledTimes(0);
    expect(originalResolveRequest).toBeCalled();
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
    expect(customResolver1).toBeCalledTimes(1);
    // Never called
    expect(originalResolveRequest).toBeCalledTimes(1);
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
    expect(customResolver1).toBeCalledTimes(1);
    expect(customResolver1).toBeCalledWith(
      expect.objectContaining({ resolveRequest: expect.anything() }),
      'react-native',
      'web'
    );
  });
});
