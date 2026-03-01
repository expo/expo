import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { type PropsWithChildren, type ReactNode } from 'react';

jest.unstable_mockModule('~/ui/components/StructuredData', () => ({
  StructuredData: ({ data, id }: { data: Record<string, unknown>; id: string }) => (
    <div data-testid={id}>{JSON.stringify(data)}</div>
  ),
}));

const { FAQ } = await import('.');

function FakeCollapsible({ summary, children }: PropsWithChildren<{ summary: ReactNode }>) {
  return (
    <details>
      <summary>{summary}</summary>
      <div>{children}</div>
    </details>
  );
}

describe('FAQ', () => {
  it('renders children unchanged', () => {
    render(
      <FAQ>
        <FakeCollapsible summary="Question one?">Answer one.</FakeCollapsible>
      </FAQ>
    );

    expect(screen.getByText('Question one?')).toBeInTheDocument();
    expect(screen.getByText('Answer one.')).toBeInTheDocument();
  });

  it('injects FAQPage JSON-LD from children with summary prop', () => {
    render(
      <FAQ>
        <FakeCollapsible summary="What is Expo?">A React Native framework.</FakeCollapsible>
        <FakeCollapsible summary="Is it free?">Yes.</FakeCollapsible>
      </FAQ>
    );

    const el = screen.getByTestId('faq');
    const data = JSON.parse(el.textContent!);

    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(2);
    expect(data.mainEntity[0].name).toBe('What is Expo?');
    expect(data.mainEntity[0].acceptedAnswer.text).toBe('A React Native framework.');
    expect(data.mainEntity[1].name).toBe('Is it free?');
  });

  it('handles JSX fragment summaries', () => {
    render(
      <FAQ>
        <FakeCollapsible
          summary={
            <>
              Can I use <code>expo-camera</code>?
            </>
          }>
          Yes you can.
        </FakeCollapsible>
      </FAQ>
    );

    const el = screen.getByTestId('faq');
    const data = JSON.parse(el.textContent!);

    expect(data.mainEntity[0].name).toBe('Can I use expo-camera?');
  });

  it('does not render structured data when there are no children with summary prop', () => {
    render(
      <FAQ>
        <p>Just a paragraph.</p>
      </FAQ>
    );

    expect(screen.queryByTestId('faq')).not.toBeInTheDocument();
    expect(screen.getByText('Just a paragraph.')).toBeInTheDocument();
  });
});
