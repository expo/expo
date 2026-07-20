import { render, screen } from '@testing-library/react';
import { type PropsWithChildren } from 'react';

import { PageApiVersionContext } from '~/providers/page-api-version';
import { PageMetadataContext } from '~/providers/page-metadata';
import { type PageMetadata } from '~/types/common';

import { APIInstallSection } from './InstallSection';

function Providers({
  children,
  version,
  meta,
}: PropsWithChildren<{ version: string; meta: PageMetadata }>) {
  return (
    <PageApiVersionContext.Provider
      value={{
        version: version as never,
        hasVersion: true,
        setVersion: () => {},
      }}>
      <PageMetadataContext.Provider value={meta}>{children}</PageMetadataContext.Provider>
    </PageApiVersionContext.Provider>
  );
}

const widgetsMeta: PageMetadata = { packageName: 'expo-widgets', exampleName: 'with-widgets' };

describe(APIInstallSection, () => {
  it('shows install and example tabs on the latest SDK version', () => {
    render(
      <Providers version="v57.0.0" meta={widgetsMeta}>
        <APIInstallSection />
      </Providers>
    );

    expect(screen.getByRole('tab', { name: 'Install library' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Start with an example' })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('npx create-expo-app --example with-widgets');
    expect(document.body).toHaveTextContent('npx expo install expo-widgets');
    for (const packageManager of ['npm', 'yarn', 'pnpm', 'bun']) {
      const switchers = screen.getAllByRole('tab', { name: packageManager, hidden: true });
      expect(switchers.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('shows the tabs when browsing via the latest alias', () => {
    render(
      <Providers version="latest" meta={widgetsMeta}>
        <APIInstallSection />
      </Providers>
    );

    expect(screen.getByRole('tab', { name: 'Start with an example' })).toBeInTheDocument();
  });

  it('hides the example tab on older SDK versions', () => {
    render(
      <Providers version="v54.0.0" meta={widgetsMeta}>
        <APIInstallSection />
      </Providers>
    );

    expect(screen.queryByRole('tab', { name: 'Start with an example' })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('create-expo-app');
    expect(document.body).toHaveTextContent('npx expo install expo-widgets');
  });

  it('renders the plain install section when the page has no example', () => {
    render(
      <Providers version="v57.0.0" meta={{ packageName: 'expo-camera' }}>
        <APIInstallSection />
      </Providers>
    );

    expect(screen.queryByRole('tab', { name: 'Install library' })).not.toBeInTheDocument();
    expect(document.body).toHaveTextContent('npx expo install expo-camera');
  });
});
