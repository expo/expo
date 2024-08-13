import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
import { PropsWithChildren } from 'react';

import {
  PageApiVersionProvider,
  usePageApiVersion,
  getVersionFromPath,
  replaceVersionInPath,
} from './page-api-version';

jest.mock('next/router', () => mockRouter);

function renderContext(initialUrl: string, onPush?: any) {
  return renderHook(usePageApiVersion, {
    wrapper: (props: PropsWithChildren<object>) => (
      <MemoryRouterProvider url={initialUrl} onPush={onPush}>
        <PageApiVersionProvider>{props.children}</PageApiVersionProvider>
      </MemoryRouterProvider>
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
    const { result } = renderContext('/versions/v44.0.0/sdk/notifications');
    expect(result.current).toMatchObject({ version: 'v44.0.0', hasVersion: true });
  });

  it('uses unversioned version from pathname', () => {
    const { result } = renderContext('/versions/unversioned/react-native/view-props');
    expect(result.current).toMatchObject({ version: 'unversioned', hasVersion: true });
  });

  it('uses latest version from pathname', () => {
    const { result } = renderContext('/versions/latest/sdk');
    expect(result.current).toMatchObject({ version: 'latest', hasVersion: true });
  });

  it('updates router and version when setting version', () => {
    const onPush = jest.fn<typeof mockRouter.push>();
    const { result, rerender } = renderContext('/versions/latest/sdk', onPush);
    expect(result.current).toMatchObject({ version: 'latest', hasVersion: true });
    act(() => result.current.setVersion('unversioned'));
    rerender();
    expect(onPush).toBeCalledWith('/versions/unversioned/sdk', { shallow: false });
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
