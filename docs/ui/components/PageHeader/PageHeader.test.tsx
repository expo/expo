import { screen, fireEvent } from '@testing-library/react';
import { createRequire } from 'node:module';

import { renderWithHeadings, renderWithTestRouter } from '~/common/test-utilities';

import { PageHeader } from './PageHeader';

const require = createRequire(import.meta.url);

describe(PageHeader, () => {
  test('displays npm registry link', async () => {
    renderWithHeadings(
      <PageHeader title="test-title" packageName="expo-av" testRequire={require} />
    );
    const linkElement = screen.getAllByRole('link', { hidden: false })[0];
    expect(linkElement.getAttribute('href')).toEqual('https://www.npmjs.com/package/expo-av');

    fireEvent.focus(linkElement);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 1000 });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('View package in npm registry');
  });

  test('displays GitHub source code link', async () => {
    renderWithHeadings(
      <PageHeader
        title="test-title"
        packageName="expo-av"
        sourceCodeUrl="https://github.com/expo/expo/tree/main/packages/expo-av"
        testRequire={require}
      />
    );
    const linkElement = screen.getAllByRole('link', { hidden: false, name: 'GitHub' })[0];
    expect(linkElement.getAttribute('href')).toEqual(
      'https://github.com/expo/expo/tree/main/packages/expo-av'
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
    expect(tooltip).toHaveTextContent('View package changelog on GitHub');
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

  test('displays bundled version when packageName provided', () => {
    renderWithHeadings(
      <PageHeader
        title="test-title"
        packageName="expo-av"
        sourceCodeUrl="https://github.com/expo/expo/tree/main/packages/expo-av"
        testRequire={require}
      />
    );
    void screen.findByText(/bundled version:/i);
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
});
