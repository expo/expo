import { fireEvent, render } from '@testing-library/react';

import { Collapsible } from '.';

describe(Collapsible, () => {
  it('hides content by default', () => {
    const { getByText } = render(<Collapsible summary="Summary">Content</Collapsible>);
    expect(getByText('Summary')).toBeVisible();
    expect(getByText('Content')).not.toBeVisible();
  });

  it('shows content when opened', () => {
    const { getByText } = render(<Collapsible summary="Summary">Content</Collapsible>);
    fireEvent.click(getByText('Summary'));
    expect(getByText('Summary')).toBeVisible();
    expect(getByText('Content')).toBeVisible();
  });

  it('shows content when rendered with open', () => {
    const { getByText } = render(
      <Collapsible summary="Summary" open>
        Content
      </Collapsible>
    );
    expect(getByText('Summary')).toBeVisible();
    expect(getByText('Content')).toBeVisible();
  });
});
