import { render } from '@testing-library/react';

import { Blockquote } from './Blockquote';

import { P } from '~/ui/components/Text';

describe('Blockquote', () => {
  it('renders with default info icon', () => {
    const { getByTitle } = render(<Blockquote>Hello</Blockquote>);
    expect(getByTitle('Info-icon')).toBeInTheDocument();
  });

  it('renders with emoji as icon', () => {
    const { getByText } = render(<Blockquote>🎨 Hello</Blockquote>);
    expect(getByText('🎨')).toBeInTheDocument();
    expect(getByText('🎨')).not.toBe(getByText('Hello'));
  });

  it('renders with type from special warning emoji ⚠️', () => {
    const { getByTitle } = render(<Blockquote>⚠️ Careful</Blockquote>);
    expect(getByTitle('Warning-icon')).toBeInTheDocument();
  });

  it('renders with type from special error emoji ❌', () => {
    const { getByTitle } = render(<Blockquote>❌ Watch out</Blockquote>);
    expect(getByTitle('Error-icon')).toBeInTheDocument();
  });

  it('renders with multiple emojis', () => {
    const { getByText, getByTitle } = render(<Blockquote>⚠️ Watch ❌ out</Blockquote>);
    expect(getByTitle('Warning-icon')).toBeInTheDocument();
    expect(getByText('Watch ❌ out')).toBeInTheDocument();
  });

  // Markdown adds unnecessary paragraphs inside blockquotes.
  // Test if the blockquote extracts the first emoji with paragraphs too.
  it('renders with emoji wrapped in paragraph', () => {
    const { getByTitle } = render(
      <Blockquote>
        <P>⚠️ Careful</P>
      </Blockquote>
    );
    expect(getByTitle('Warning-icon')).toBeInTheDocument();
  });

  it('renders with multiple emoji wrapped in multiple paragraph', () => {
    const { getByTitle } = render(
      <Blockquote>
        <P>❌ Watch out</P>
        <P>⚠️ Careful</P>
      </Blockquote>
    );
    expect(getByTitle('Error-icon')).toBeInTheDocument();
  });
});
