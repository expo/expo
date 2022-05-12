import { fireEvent, render, screen } from '@testing-library/react';

import { Collapsible } from '.';

describe(Collapsible, () => {
  it('hides content by default', () => {
    render(<Collapsible summary="Summary">Content</Collapsible>);
    expect(screen.getByText('Summary')).toBeVisible();
    expect(screen.getByText('Content')).not.toBeVisible();
  });

  it('shows content when opened', () => {
    render(<Collapsible summary="Summary">Content</Collapsible>);
    fireEvent.click(screen.getByText('Summary'));
    expect(screen.getByText('Summary')).toBeVisible();
    expect(screen.getByText('Content')).toBeVisible();
  });

  it('shows content when rendered with open', () => {
    render(
      <Collapsible summary="Summary" open>
        Content
      </Collapsible>
    );
    expect(screen.getByText('Summary')).toBeVisible();
    expect(screen.getByText('Content')).toBeVisible();
  });
});
