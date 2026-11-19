import { render, screen } from '@testing-library/react';
import { type PropsWithChildren } from 'react';

import { axe } from '~/common/test-utilities';
import { PageMetadataContext } from '~/providers/page-metadata';
import { type PageMetadata } from '~/types/common';

import { AgentSkillSection } from './AgentSkillSection';

function Providers({ children, meta }: PropsWithChildren<{ meta: PageMetadata }>) {
  return <PageMetadataContext.Provider value={meta}>{children}</PageMetadataContext.Provider>;
}

const sqliteMeta: PageMetadata = { packageName: 'expo-sqlite' };

describe(AgentSkillSection, () => {
  it('should render the install command with the package name from the page metadata', () => {
    render(
      <Providers meta={sqliteMeta}>
        <AgentSkillSection />
      </Providers>
    );

    expect(document.body).toHaveTextContent('npx --yes @expo/agent-cli@latest install expo-sqlite');
  });

  it('should offer the command for each package manager', () => {
    render(
      <Providers meta={sqliteMeta}>
        <AgentSkillSection />
      </Providers>
    );

    for (const packageManager of ['npm', 'yarn', 'pnpm', 'bun']) {
      expect(screen.getByRole('tab', { name: packageManager, hidden: true })).toBeInTheDocument();
    }
  });

  it('should prefer the package name prop over the page metadata', () => {
    render(
      <Providers meta={sqliteMeta}>
        <AgentSkillSection packageName="expo-app-intents" />
      </Providers>
    );

    expect(document.body).toHaveTextContent(
      'npx --yes @expo/agent-cli@latest install expo-app-intents'
    );
    expect(document.body).not.toHaveTextContent('install expo-sqlite');
  });

  it('should have no axe violations', async () => {
    const { container } = render(
      <Providers meta={sqliteMeta}>
        <AgentSkillSection />
      </Providers>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
