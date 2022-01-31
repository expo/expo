import { act, renderHook } from '@testing-library/react-hooks';
import Router from 'next/router';
import React from 'react';

import {
  PageApiVersionProvider,
  usePageApiVersion,
  getVersionFromPath,
  isVersionedPath,
  replaceVersionInPath,
} from './page-api-version';

jest.mock('next/router');

const mockedRouter = jest.mocked(Router);

function renderContext(router = Router) {
  return renderHook(usePageApiVersion, {
    wrapper: props => (
      <PageApiVersionProvider router={router}>{props.children}</PageApiVersionProvider>
    ),
  });
}

describe('PageApiVersionContext', () => {
  it('defaults to latest version', () => {
    const { result } = renderHook(usePageApiVersion);
    expect(result.current).toMatchObject({ version: 'latest', hasVersion: false });
  });

  it('defaults to setVersion throwing error', () => {
    const { result } = renderHook(usePageApiVersion);
    expect(() => result.current.setVersion('v44.0.0')).toThrowError(
      'PageApiVersionContext not found'
    );
  });
});

describe(PageApiVersionProvider, () => {
  it('uses sdk version from pathname', () => {
    mockedRouter.pathname = '/versions/v44.0.0/sdk/notifications';
    const { result } = renderContext();
    expect(result.current).toMatchObject({ version: 'v44.0.0', hasVersion: true });
  });

  it('uses unversioned version from pathname', () => {
    mockedRouter.pathname = '/versions/unversioned/react-native/view-props';
    const { result } = renderContext();
    expect(result.current).toMatchObject({ version: 'unversioned', hasVersion: true });
  });

  it('uses latest version from pathname', () => {
    mockedRouter.pathname = '/versions/latest/sdk';
    const { result } = renderContext();
    expect(result.current).toMatchObject({ version: 'latest', hasVersion: true });
  });

  it('updates router and version when setting version', () => {
    mockedRouter.pathname = '/versions/latest/sdk';
    mockedRouter.push.mockImplementation(url => {
      mockedRouter.pathname = String(url);
      return Promise.resolve(true);
    });

    const { result, rerender } = renderContext();
    expect(result.current).toMatchObject({ version: 'latest', hasVersion: true });
    act(() => result.current.setVersion('unversioned'));
    rerender();
    expect(result.current).toMatchObject({ version: 'unversioned', hasVersion: true });
  });
});

describe(getVersionFromPath, () => {
  it('returns unversioned from pathname', () => {
    expect(getVersionFromPath('/versions/unversioned')).toBe('unversioned');
  });

  it('returns latest from sdk pathname', () => {
    expect(getVersionFromPath('/versions/latest/sdk/notifications')).toBe('latest');
  });

  it('returns v44.0.0 from react-native pathname', () => {
    expect(getVersionFromPath('/versions/v44.0.0/react-native/view-props')).toBe('v44.0.0');
  });

  it('returns null for non-versioned pathname', () => {
    expect(getVersionFromPath('/guides/monorepos/')).toBeNull();
  });
});

describe(isVersionedPath, () => {
  it('returns true for unversioned pathname', () => {
    expect(isVersionedPath('/versions/unversioned')).toBe(true);
  });

  it('returns true for sdk pathname', () => {
    expect(isVersionedPath('/versions/latest/sdk/notifications')).toBe(true);
  });

  it('returns true for react-native pathname', () => {
    expect(isVersionedPath('/versions/v44.0.0/react-native/stylesheet/')).toBe(true);
  });

  it('returns false for non-versioned pathname', () => {
    expect(isVersionedPath('/build-reference/how-tos/')).toBe(false);
  });
});

describe(replaceVersionInPath, () => {
  it('returns same pathname for non-versioned pathname', () => {
    expect(replaceVersionInPath('/build-reference/how-tos/', 'latest')).toBe(
      '/build-reference/how-tos/'
    );
  });

  it('returns new pathname for unversioned pathname', () => {
    expect(replaceVersionInPath('/versions/unversioned', 'latest')).toBe('/versions/latest');
  });

  it('returns new pathname for sdk pathname', () => {
    expect(replaceVersionInPath('/versions/latest/sdk/notifications', 'v44.0.0')).toBe(
      '/versions/v44.0.0/sdk/notifications'
    );
  });

  it('returns new pathname for react-native pathname', () => {
    expect(replaceVersionInPath('/versions/v44.0.0/react-native/stylesheet/', 'v43.0.0')).toBe(
      '/versions/v43.0.0/react-native/stylesheet/'
    );
  });
});
