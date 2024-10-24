import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { createRequire } from 'node:module';

import APISection from './APISection';

import { attachEmotionSerializer, renderWithHeadings } from '~/common/test-utilities';

const require = createRequire(import.meta.url);

attachEmotionSerializer(expect);

describe('APISection', () => {
  test('no data', () => {
    console.error = jest.fn();

    const { container } = render(<APISection packageName="expo-none" testRequire={require} />);

    expect(console.error).toHaveBeenCalled();

    expect(screen.getAllByText('No API data file found, sorry!')).toHaveLength(1);

    expect(container).toMatchSnapshot();
  });

  test('expo-apple-authentication', () => {
    const { container } = renderWithHeadings(
      <APISection
        packageName="expo-apple-authentication"
        forceVersion="unversioned"
        testRequire={require}
      />
    );

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(24);
    expect(screen.getAllByRole('table')).toHaveLength(11);

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

  test('expo-pedometer', () => {
    const { container } = renderWithHeadings(
      <APISection packageName="expo-pedometer" forceVersion="unversioned" testRequire={require} />
    );

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(11);
    expect(screen.getAllByRole('table')).toHaveLength(6);

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

  test('expo-asset', () => {
    renderWithHeadings(
      <APISection packageName="expo-asset" forceVersion="unversioned" testRequire={require} />
    );

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(17);
    expect(screen.getAllByRole('table')).toHaveLength(7);

    expect(screen.queryByText('Classes'));
    expect(screen.queryByText('Asset Properties'));
    expect(screen.queryByText('Asset Methods'));

    expect(screen.queryByDisplayValue('localUri'));
    expect(screen.queryByDisplayValue('fromURI()'));

    expect(screen.queryAllByText('Props')).toHaveLength(0);
    expect(screen.queryAllByText('Enums')).toHaveLength(0);
  });
});
