import { render, screen } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import { PropsWithChildren } from 'react';

import { createHeadingManager } from '~/common/headingManager';
import { HeadingsContext } from '~/common/withHeadingManager';

import { Prerequisites, Requirement } from '.';

const WrapWithContext = ({ children }: PropsWithChildren) => {
  const headingManager = createHeadingManager(new GithubSlugger(), { headings: [] });
  return <HeadingsContext.Provider value={headingManager}>{children}</HeadingsContext.Provider>;
};

describe('Prerequisites', () => {
  it('renders a single requirement without the numeric prefix', () => {
    render(
      <WrapWithContext>
        <Prerequisites open>
          <Requirement title="Only requirement">Body content.</Requirement>
        </Prerequisites>
      </WrapWithContext>
    );

    expect(screen.getByText('Only requirement')).toBeVisible();
    expect(screen.getByText('Body content.')).toBeVisible();
    expect(screen.getByText('1 requirement')).toBeVisible();
    expect(screen.queryByText('1.')).not.toBeInTheDocument();
  });

  it('renders numbered prefixes when there are multiple requirements', () => {
    render(
      <WrapWithContext>
        <Prerequisites open>
          <Requirement title="First">Step one body.</Requirement>
          <Requirement title="Second">Step two body.</Requirement>
          <Requirement title="Third">Step three body.</Requirement>
        </Prerequisites>
      </WrapWithContext>
    );

    expect(screen.getByText('First')).toBeVisible();
    expect(screen.getByText('Second')).toBeVisible();
    expect(screen.getByText('Third')).toBeVisible();
    expect(screen.getByText('3 requirements')).toBeVisible();
    expect(screen.getByText('1.')).toBeVisible();
    expect(screen.getByText('2.')).toBeVisible();
    expect(screen.getByText('3.')).toBeVisible();
  });
});
