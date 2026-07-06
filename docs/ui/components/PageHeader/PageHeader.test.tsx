import { screen, fireEvent } from '@testing-library/react';
import { createRequire } from 'node:module';

import { renderWithHeadings, renderWithTestRouter } from '~/common/test-utilities';

import { PageHeader } from './PageHeader';

const require = createRequire(import.meta.url);

describe(PageHeader, () => {
  test('displays npm registry link', async () => {
    renderWithHeadings(
      <PageHeader title="test-title" packageName="expo-audio" testRequire={require} />
    );
    const linkElement = screen.getAllByRole('link', { hidden: false })[0];
    expect(linkElement.getAttribute('href')).toEqual('https://www.npmjs.com/package/expo-audio');

    fireEvent.focus(linkElement);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 1000 });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('View library in npm registry');
  });

  test('displays GitHub source code link', async () => {
    renderWithHeadings(
      <PageHeader
        title="test-title"
        packageName="expo-audio"
        sourceCodeUrl="https://github.com/expo/expo/tree/main/packages/expo-audio"
        testRequire={require}
      />
    );
    const linkElement = screen.getAllByRole('link', { hidden: false, name: 'GitHub' })[0];
    expect(linkElement.getAttribute('href')).toEqual(
      'https://github.com/expo/expo/tree/main/packages/expo-audio'
    );

    fireEvent.focus(linkElement);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 1000 });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('View source code on GitHub');
  });

  test('displays GitHub changelog link', async () => {
    renderWithHeadings(
      <PageHeader
        title="test-title"
        packageName="expo-audio"
        sourceCodeUrl="https://github.com/expo/expo/tree/main/packages/expo-audio"
        testRequire={require}
      />
    );
    const linkElement = screen.getAllByRole('link', { hidden: false, name: 'Changelog' })[0];
    expect(linkElement.getAttribute('href')).toEqual(
      'https://github.com/expo/expo/tree/main/packages/expo-audio/CHANGELOG.md'
    );

    fireEvent.focus(linkElement);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 1000 });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('View library changelog on GitHub');
  });

  test('do not display GitHub changelog link for vendored packages', async () => {
    renderWithHeadings(
      <PageHeader
        title="test-title"
        packageName="react-native-reanimated"
        sourceCodeUrl="https://github.com/software-mansion/react-native-reanimated"
        testRequire={require}
      />
    );
    const linkElement = screen.queryAllByRole('link', { hidden: false, name: 'Changelog' })[0];
    expect(linkElement).toBe(undefined);
  });

  test('displays recommended version when packageName provided', async () => {
    renderWithHeadings(
      <PageHeader
        title="test-title"
        packageName="expo-audio"
        sourceCodeUrl="https://github.com/expo/expo/tree/main/packages/expo-audio"
        testRequire={require}
      />
    );
    await screen.findByText(/recommended version:/i);
  });

  test('explains the recommended version through an accessible tooltip', async () => {
    renderWithHeadings(
      <PageHeader title="test-title" packageName="expo-audio" testRequire={require} />
    );
    const infoButton = await screen.findByRole('button', {
      name: /more information about recommended version/i,
    });

    fireEvent.focus(infoButton);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 1000 });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(/compatible with the expo sdk version/i);
    expect(tooltip).not.toHaveTextContent(/included in expo go/i);
    expect(infoButton).toHaveAttribute('aria-describedby', tooltip.id);
  });

  test('notes the Expo Go library version in the tooltip when included in Expo Go', async () => {
    renderWithHeadings(
      <PageHeader
        title="test-title"
        packageName="expo-audio"
        platforms={['ios', 'android', 'expo-go']}
        testRequire={require}
      />
    );
    const infoButton = await screen.findByRole('button', {
      name: /more information about recommended version/i,
    });

    fireEvent.focus(infoButton);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 1000 });
    expect(tooltip).toHaveTextContent(/compatible with the expo sdk version/i);
    expect(tooltip).toHaveTextContent(/library version included in expo go/i);
  });

  test('displays edit page link for non-API docs', () => {
    const router = { pathname: '/router/reference/hooks/' };

    renderWithTestRouter(<PageHeader title="test-title" />, router);
    const linkElement = screen.getAllByRole('link', { hidden: false })[0];

    expect(linkElement.getAttribute('href')).toEqual(
      'https://github.com/expo/expo/edit/main/docs/pages/router/reference/hooks.mdx'
    );
    expect(linkElement.getAttribute('aria-label')).toEqual('Edit content of this page on GitHub');
  });

  test('hides markdown actions on the hydration render even when the URL has a version pair', () => {
    renderWithTestRouter(<PageHeader title="Upgrade native project" />, {
      pathname: '/bare/upgrade',
      asPath: '/bare/upgrade/?fromSdk=56&toSdk=57',
      isReady: false,
    });

    expect(screen.queryAllByText('Copy page')).toHaveLength(0);
  });

  test('shows markdown actions once the router is ready with a version pair', () => {
    renderWithTestRouter(<PageHeader title="Upgrade native project" />, {
      pathname: '/bare/upgrade',
      asPath: '/bare/upgrade/?fromSdk=56&toSdk=57',
      isReady: true,
    });

    expect(screen.queryAllByText('Copy page').length).toBeGreaterThan(0);
  });

  test('keeps markdown actions hidden on the upgrade helper without a version pair', () => {
    renderWithTestRouter(<PageHeader title="Upgrade native project" />, {
      pathname: '/bare/upgrade',
      asPath: '/bare/upgrade/',
      isReady: true,
    });

    expect(screen.queryAllByText('Copy page')).toHaveLength(0);
  });

  test('shows markdown actions on regular pages during the hydration render', () => {
    renderWithTestRouter(<PageHeader title="Overview" />, {
      pathname: '/guides/overview',
      asPath: '/guides/overview/',
      isReady: false,
    });

    expect(screen.queryAllByText('Copy page').length).toBeGreaterThan(0);
  });
});
