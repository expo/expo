import { render, screen } from '@testing-library/react';

import { Blockquote } from './Blockquote';

import { P } from '~/ui/components/Text';

describe(Blockquote, () => {
  it('renders with default info icon', () => {
    render(<Blockquote>Hello</Blockquote>);
    expect(screen.getByTitle('Info-icon')).toBeInTheDocument();
  });

  it('renders with emoji as icon', () => {
    render(<Blockquote>🎨 Hello</Blockquote>);
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('🎨')).not.toBe(screen.getByText('Hello'));
  });

  it('renders with type from special warning emoji ⚠️', () => {
    render(<Blockquote>⚠️ Careful</Blockquote>);
    expect(screen.getByTitle('Warning-icon')).toBeInTheDocument();
  });

  it('renders with type from special error emoji ❌', () => {
    render(<Blockquote>❌ Watch out</Blockquote>);
    expect(screen.getByTitle('Error-icon')).toBeInTheDocument();
  });

  it('renders with multiple emojis', () => {
    render(<Blockquote>⚠️ Watch ❌ out</Blockquote>);
    expect(screen.getByTitle('Warning-icon')).toBeInTheDocument();
    expect(screen.getByText('Watch ❌ out')).toBeInTheDocument();
  });

  // Markdown adds paragraphs inside blockquotes, which is useful for multiline blockquotes.
  // Test if the blockquote extracts the first emoji with paragraphs too.
  it('renders with emoji wrapped in paragraph', () => {
    render(
      <Blockquote>
        <P>⚠️ Careful</P>
      </Blockquote>
    );
    expect(screen.getByTitle('Warning-icon')).toBeInTheDocument();
  });

  it('renders with multiple emoji wrapped in multiple paragraph', () => {
    render(
      <Blockquote>
        <P>❌ Watch out</P>
        <P>⚠️ Careful</P>
      </Blockquote>
    );
    expect(screen.getByTitle('Error-icon')).toBeInTheDocument();
  });
});
