import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { type PropsWithChildren, type ReactNode } from 'react';

import { axe, renderWithHeadings } from '~/common/test-utilities';

jest.unstable_mockModule('~/ui/components/StructuredData', () => ({
  StructuredData: ({ data, id }: { data: Record<string, unknown>; id: string }) => (
    <div data-testid={id}>{JSON.stringify(data)}</div>
  ),
}));

const { FAQ } = await import('.');
const { markdownComponents } = await import('~/ui/components/Markdown');
const { h2: H2, h3: H3 } = markdownComponents;

function FakeCollapsible({ summary, children }: PropsWithChildren<{ summary: ReactNode }>) {
  return (
    <details>
      <summary>{summary}</summary>
      <div>{children}</div>
    </details>
  );
}

function FakeTerminal({ cmd }: { cmd: string[] | Record<string, string[]> }) {
  return <pre>{JSON.stringify(cmd)}</pre>;
}

type Schema = Record<string, unknown> & {
  mainEntity: { name: string; acceptedAnswer: { text: string } }[];
};

function readSchema(): Schema {
  return JSON.parse(screen.getByTestId('faq').textContent ?? '');
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

    const data = readSchema();

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

    expect(readSchema().mainEntity[0].name).toBe('Can I use expo-camera?');
  });

  it('separates the blocks of a multi-paragraph answer with a space', () => {
    render(
      <FAQ>
        <FakeCollapsible summary="Question?">
          <p>Answer one.</p>
          <p>Answer two.</p>
        </FakeCollapsible>
      </FAQ>
    );

    expect(readSchema().mainEntity[0].acceptedAnswer.text).toBe('Answer one. Answer two.');
  });

  it('collapses whitespace inside an answer', () => {
    render(
      <FAQ>
        <FakeCollapsible summary="Question?">
          <pre>{'line one\n  line two'}</pre>
        </FakeCollapsible>
      </FAQ>
    );

    expect(readSchema().mainEntity[0].acceptedAnswer.text).toBe('line one line two');
  });

  it('keeps the file name of a titled code block as plain text', () => {
    render(
      <FAQ>
        <FakeCollapsible summary="Question?">
          <pre>
            <code>{'@@@app.json@@@{ "expo": {} }'}</code>
          </pre>
        </FakeCollapsible>
      </FAQ>
    );

    expect(readSchema().mainEntity[0].acceptedAnswer.text).toBe('app.json { "expo": {} }');
  });

  it('includes the commands of a terminal block', () => {
    render(
      <FAQ>
        <FakeCollapsible summary="Question?">
          <p>Run:</p>
          <FakeTerminal cmd={['$ eas build --platform ios', '# then wait']} />
        </FakeCollapsible>
      </FAQ>
    );

    expect(readSchema().mainEntity[0].acceptedAnswer.text).toBe(
      'Run: $ eas build --platform ios # then wait'
    );
  });

  it('includes the first package manager variant of a terminal block', () => {
    render(
      <FAQ>
        <FakeCollapsible summary="Question?">
          <FakeTerminal
            cmd={{
              npm: ['$ npx expo install expo-observe'],
              yarn: ['$ yarn expo install expo-observe'],
            }}
          />
        </FakeCollapsible>
      </FAQ>
    );

    expect(readSchema().mainEntity[0].acceptedAnswer.text).toBe('$ npx expo install expo-observe');
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

  it('has no axe violations', async () => {
    const { container } = render(
      <FAQ>
        <FakeCollapsible summary="Question one?">Answer one.</FakeCollapsible>
        <FakeCollapsible summary="Question two?">Answer two.</FakeCollapsible>
      </FAQ>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('with headings', () => {
    it('reads each heading with its own text as a question and skips bare labels', () => {
      renderWithHeadings(
        <FAQ>
          <p>An intro that belongs to no question.</p>
          <H2>Plans</H2>
          <H3>How can I update my plan?</H3>
          <p>Open the billing page.</p>
          <p>Pick a plan.</p>
          <H3>How can I cancel a plan?</H3>
          <p>Contact support.</p>
        </FAQ>
      );

      const data = readSchema();

      expect(data['@type']).toBe('FAQPage');
      expect(data.mainEntity.map(item => item.name)).toEqual([
        'How can I update my plan?',
        'How can I cancel a plan?',
      ]);
      expect(data.mainEntity[0].acceptedAnswer.text).toBe('Open the billing page. Pick a plan.');
      expect(data.mainEntity[1].acceptedAnswer.text).toBe('Contact support.');
    });

    it('answers a heading with its whole section and lists its sub-headings too', () => {
      renderWithHeadings(
        <FAQ>
          <H2>What are the store policies?</H2>
          <p>Both stores allow it.</p>
          <H3>Google Play Store</H3>
          <p>Allowed.</p>
          <H2>Is Expo Go open source?</H2>
          <p>Yes.</p>
        </FAQ>
      );

      const data = readSchema();

      expect(data.mainEntity.map(item => item.name)).toEqual([
        'What are the store policies?',
        'Google Play Store',
        'Is Expo Go open source?',
      ]);
      expect(data.mainEntity[0].acceptedAnswer.text).toBe(
        'Both stores allow it. Google Play Store Allowed.'
      );
      expect(data.mainEntity[1].acceptedAnswer.text).toBe('Allowed.');
      expect(data.mainEntity[2].acceptedAnswer.text).toBe('Yes.');
    });

    it('reads collapsibles and headings on the same page in document order', () => {
      renderWithHeadings(
        <FAQ>
          <H2>Learn more</H2>
          <FakeCollapsible summary="Question one?">Answer one.</FakeCollapsible>
          <H2>Why use a development build?</H2>
          <p>Expo Go is a playground.</p>
          <FakeCollapsible summary="Question two?">Answer two.</FakeCollapsible>
        </FAQ>
      );

      const data = readSchema();

      expect(data.mainEntity.map(item => item.name)).toEqual([
        'Question one?',
        'Why use a development build?',
        'Question two?',
      ]);
      expect(data.mainEntity[1].acceptedAnswer.text).toBe(
        'Expo Go is a playground. Question two? Answer two.'
      );
      expect(data.mainEntity[2].acceptedAnswer.text).toBe('Answer two.');
    });

    it('drops a heading that has no text of its own', () => {
      renderWithHeadings(
        <FAQ>
          <H2>Unanswered?</H2>
          <H2>Answered?</H2>
          <p>Yes.</p>
        </FAQ>
      );

      expect(readSchema().mainEntity.map(item => item.name)).toEqual(['Answered?']);
    });

    it('renders children unchanged and no structured data when no heading has its own text', () => {
      renderWithHeadings(
        <FAQ>
          <H2>Only a label</H2>
          <H3>Another label</H3>
        </FAQ>
      );

      expect(screen.queryByTestId('faq')).not.toBeInTheDocument();
      expect(screen.getByText('Only a label')).toBeInTheDocument();
      expect(screen.getByText('Another label')).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
      const { container } = renderWithHeadings(
        <FAQ>
          <H2>Question one?</H2>
          <p>Answer one.</p>
          <H2>Question two?</H2>
          <p>Answer two.</p>
        </FAQ>
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
