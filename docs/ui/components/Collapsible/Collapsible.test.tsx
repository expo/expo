import { fireEvent, render } from '@testing-library/react';

import { Collapsible, DETAILS, SUMMARY } from '.';

import { P } from '~/ui/components/Text';

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

// TODO(cedric): remove everything below this line once we switch to MDX v2
describe(DETAILS, () => {
  it('renders without summary', () => {
    const { getByText } = render(
      <DETAILS>
        <P>Content</P>
      </DETAILS>
    );
    expect(getByText('Content')).toBeInTheDocument();
  });

  it('renders with hidden and separated content', () => {
    const { getByTestId } = render(
      <DETAILS testID="parent">
        {/* @ts-ignore - We have to fake MDX v1's original type prop here, that's what we use to find it */}
        <SUMMARY testID="summary" originalType="summary">
          Summary
        </SUMMARY>
        <P testID="content">Content</P>
      </DETAILS>
    );
    expect(getByTestId('summary').parentNode).toBe(getByTestId('parent'));
    expect(getByTestId('content').parentNode).not.toBe(getByTestId('parent'));
  });
});
