import { render, RenderOptions } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import React, { FC, ReactElement } from 'react';

import { HeadingsContext } from '../page-higher-order/withHeadingManager';
import APISection from './APISection';

import { HeadingManager } from '~/common/headingManager';

const Wrapper: FC = ({ children }) => (
  <HeadingsContext.Provider value={new HeadingManager(new GithubSlugger(), { headings: [] })}>
    {children}
  </HeadingsContext.Provider>
);

const customRender = (element: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(element, { wrapper: Wrapper, ...options });

describe('APISection', () => {
  test('no data', () => {
    const { container, getAllByText } = render(<APISection packageName="expo-none" />);

    expect(getAllByText('No API data file found, sorry!')).toHaveLength(1);

    expect(container).toMatchSnapshot();
  });

  test('expo-apple-authentication', () => {
    const { container, queryByText, getAllByRole, queryAllByText, queryByDisplayValue } =
      customRender(
        <APISection packageName="expo-apple-authentication" forceVersion="unversioned" />
      );

    expect(getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(getAllByRole('heading', { level: 3 })).toHaveLength(20);
    expect(getAllByRole('table')).toHaveLength(6);

    expect(queryByText('Event Subscriptions'));
    expect(queryByText('Components'));

    expect(queryByDisplayValue('AppleAuthenticationButton'));
    expect(queryByDisplayValue('AppleAuthenticationButtonProps'));
    expect(queryByDisplayValue('Subscription'));

    expect(queryAllByText('Constants')).toHaveLength(0);
    expect(queryAllByText('Hooks')).toHaveLength(0);
    expect(queryAllByText('Interfaces')).toHaveLength(0);

    expect(container).toMatchSnapshot();
  });

  test('expo-barcode-scanner', () => {
    const { container, queryByText, getAllByRole, queryAllByText, queryByDisplayValue } =
      customRender(
        <APISection
          packageName="expo-barcode-scanner"
          apiName="BarCodeScanner"
          forceVersion="unversioned"
        />
      );

    expect(getAllByRole('heading', { level: 2 })).toHaveLength(6);
    expect(getAllByRole('heading', { level: 3 })).toHaveLength(16);

    expect(queryByText('Components'));
    expect(queryByText('Hooks'));

    expect(queryByDisplayValue('BarCodeEvent'));
    expect(queryByDisplayValue('BarCodeScannerProps'));
    expect(queryByDisplayValue('Subscription'));
    expect(queryByDisplayValue('usePermissions'));

    expect(queryAllByText('Constants')).toHaveLength(0);
    expect(queryAllByText('Props')).toHaveLength(0);

    expect(container).toMatchSnapshot();
  });

  test('expo-pedometer', () => {
    const { container, queryByText, getAllByRole, queryAllByText, queryByDisplayValue } =
      customRender(<APISection packageName="expo-pedometer" forceVersion="v42.0.0" />);

    expect(getAllByRole('heading', { level: 2 })).toHaveLength(4);
    expect(getAllByRole('heading', { level: 3 })).toHaveLength(11);
    expect(getAllByRole('table')).toHaveLength(3);

    expect(queryByText('Methods'));
    expect(queryByText('Enums'));
    expect(queryByText('Interfaces'));
    expect(queryByText('Types'));

    expect(queryByDisplayValue('PermissionResponse'));
    expect(queryByDisplayValue('PermissionStatus'));

    expect(queryAllByText('Constants')).toHaveLength(0);
    expect(queryAllByText('Event Subscriptions')).toHaveLength(0);
    expect(queryAllByText('Hooks')).toHaveLength(0);

    expect(container).toMatchSnapshot();
  });
});
