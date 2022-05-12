import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Terminal } from '.';

describe(Terminal, () => {
  it('generates correct copyCmd from single command', async () => {
    render(
      <>
        <Terminal cmd={['$ expo install expo-dev-client@0.9 expo-updates@next']} />
        <textarea data-testid="paste-area" />
      </>
    );
    expect(screen.getByText('Copy')).toBeVisible();

    const user = userEvent.setup();
    await user.click(screen.getByText('Copy'));
    await user.click(screen.getByTestId('paste-area'));
    await user.paste();

    expect((screen.getByTestId('paste-area') as HTMLTextAreaElement).value).toBe(
      'expo install expo-dev-client@0.9 expo-updates@next'
    );
  });

  it('do not generates copyCmd if first line is a comment', () => {
    render(<Terminal cmd={["# We don't want this to generate cmdCopy"]} />);
    expect(screen.queryByText('Copy')).toBe(null);
  });
});
