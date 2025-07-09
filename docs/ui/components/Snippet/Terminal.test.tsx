import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Terminal } from '.';

describe(Terminal, () => {
  it('generates correct copyCmd from single command', async () => {
    render(
      <>
        <Terminal cmd={['$ expo install expo-updates']} />
        <textarea />
      </>
    );
    expect(screen.getByText('Copy')).toBeVisible();

    const user = userEvent.setup();
    await user.click(screen.getByText('Copy'));
    await user.click(screen.getByRole('textbox'));
    await user.paste();

    expect(screen.getByRole<HTMLTextAreaElement>('textbox').value).toBe(
      'expo install expo-updates'
    );
  });

  it('generates correct copyCmd from single command with comments and blank lines', async () => {
    render(
      <>
        <Terminal
          cmd={[
            '# This line is a comment',
            '',
            '$ expo install expo-dev-client',
            '# One more to add!',
          ]}
        />
        <textarea />
      </>
    );
    expect(screen.getByText('Copy')).toBeVisible();

    const user = userEvent.setup();
    await user.click(screen.getByText('Copy'));
    await user.click(screen.getByRole('textbox'));
    await user.paste();

    expect(screen.getByRole<HTMLTextAreaElement>('textbox').value).toBe(
      'expo install expo-dev-client'
    );
  });

  it('do not generate copyCmd if first line is a comment', () => {
    render(<Terminal cmd={["# We don't want this to generate cmdCopy"]} />);
    expect(screen.queryByText('Copy')).toBe(null);
  });

  it('do not generate copyCmd if there is more than one command', () => {
    render(<Terminal cmd={['$ npx create-expo-app init test', '$ cd test']} />);
    expect(screen.queryByText('Copy')).toBe(null);
  });
});
