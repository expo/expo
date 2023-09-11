import { fireEvent, render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { Collapsible } from '.';

import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';

const WrapWithContext = ({ children }: PropsWithChildren) => {
  return (
    // @ts-ignore
    <HeadingsContext.Provider value={{ addHeading: () => ({ slug: 'blah' }) }}>
      {children}
    </HeadingsContext.Provider>
  );
};

describe('Collapsible', () => {
  it('hides content by default', () => {
    render(
      <WrapWithContext>
        <Collapsible summary="Summary">Content</Collapsible>
      </WrapWithContext>
    );
    expect(screen.getByText('Summary')).toBeVisible();
    expect(screen.getByText('Content')).not.toBeVisible();
  });

  it('shows content when opened', () => {
    render(
      <WrapWithContext>
        <Collapsible summary="Summary">Content</Collapsible>
      </WrapWithContext>
    );
    fireEvent.click(screen.getByText('Summary'));
    expect(screen.getByText('Summary')).toBeVisible();
    expect(screen.getByText('Content')).toBeVisible();
  });

  it('shows content when rendered with open', () => {
    render(
      <WrapWithContext>
        <Collapsible summary="Summary" open>
          Content
        </Collapsible>
      </WrapWithContext>
    );
    expect(screen.getByText('Summary')).toBeVisible();
    expect(screen.getByText('Content')).toBeVisible();
  });
});
