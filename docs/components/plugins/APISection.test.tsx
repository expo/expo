import { render, screen, RenderOptions } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import React, { PropsWithChildren, ReactElement } from 'react';

import { HeadingsContext } from '../page-higher-order/withHeadingManager';
import APISection from './APISection';

import { HeadingManager } from '~/common/headingManager';

const Wrapper = ({ children }: PropsWithChildren<object>) => (
  <HeadingsContext.Provider value={new HeadingManager(new GithubSlugger(), { headings: [] })}>
    {children}
  </HeadingsContext.Provider>
);

const customRender = (element: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(element, { wrapper: Wrapper, ...options });

describe('APISection', () => {
  test('no data', () => {
    const { container } = render(<APISection packageName="expo-none" />);

    expect(screen.getAllByText('No API data file found, sorry!')).toHaveLength(1);

    expect(container).toMatchSnapshot();
  });

  test('expo-apple-authentication', () => {
    const { container } = customRender(
      <APISection packageName="expo-apple-authentication" forceVersion="unversioned" />
    );

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(20);
    expect(screen.getAllByRole('table')).toHaveLength(6);

    expect(screen.queryByText('Event Subscriptions'));
    expect(screen.queryByText('Components'));

    expect(screen.queryByDisplayValue('AppleAuthenticationButton'));
    expect(screen.queryByDisplayValue('AppleAuthenticationButtonProps'));
    expect(screen.queryByDisplayValue('Subscription'));

    expect(screen.queryAllByText('Constants')).toHaveLength(0);
    expect(screen.queryAllByText('Hooks')).toHaveLength(0);
    expect(screen.queryAllByText('Interfaces')).toHaveLength(0);

    expect(container).toMatchSnapshot();
  });

  test('expo-barcode-scanner', () => {
    const { container } = customRender(
      <APISection
        packageName="expo-barcode-scanner"
        apiName="BarCodeScanner"
        forceVersion="unversioned"
      />
    );

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(16);

    expect(screen.queryByText('Components'));
    expect(screen.queryByText('Hooks'));

    expect(screen.queryByDisplayValue('BarCodeEvent'));
    expect(screen.queryByDisplayValue('BarCodeScannerProps'));
    expect(screen.queryByDisplayValue('Subscription'));
    expect(screen.queryByDisplayValue('usePermissions'));

    expect(screen.queryAllByText('Constants')).toHaveLength(0);
    expect(screen.queryAllByText('Props')).toHaveLength(0);

    expect(container).toMatchSnapshot();
  });

  test('expo-pedometer', () => {
    const { container } = customRender(
      <APISection packageName="expo-pedometer" forceVersion="v42.0.0" />
    );

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(11);
    expect(screen.getAllByRole('table')).toHaveLength(3);

    expect(screen.queryByText('Methods'));
    expect(screen.queryByText('Enums'));
    expect(screen.queryByText('Interfaces'));
    expect(screen.queryByText('Types'));

    expect(screen.queryByDisplayValue('PermissionResponse'));
    expect(screen.queryByDisplayValue('PermissionStatus'));

    expect(screen.queryAllByText('Constants')).toHaveLength(0);
    expect(screen.queryAllByText('Event Subscriptions')).toHaveLength(0);
    expect(screen.queryAllByText('Hooks')).toHaveLength(0);

    expect(container).toMatchSnapshot();
  });
});
