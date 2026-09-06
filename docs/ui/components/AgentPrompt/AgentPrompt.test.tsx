import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';

import { axe } from '~/common/test-utilities';

import { AgentPrompt } from '.';
import { AGENT_PROMPTS } from './prompts';

jest.mock('next/router', () => mockRouter);

const PAGE = '/develop/development-builds/introduction/';

const { title, description, options } = AGENT_PROMPTS['development-builds'];

function promptFor(id: string) {
  return options.find(option => option.id === id)!.prompt;
}

function setupClipboard() {
  const writeText = jest.fn();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

function renderAt(url: string) {
  return render(
    <MemoryRouterProvider url={url}>
      <AgentPrompt page="development-builds" />
    </MemoryRouterProvider>
  );
}

async function copiedTextAsync(writeText: ReturnType<typeof setupClipboard>) {
  fireEvent.click(screen.getByRole('button', { name: /copy prompt/i }));
  await waitFor(() => {
    expect(writeText).toHaveBeenCalledTimes(1);
  });
  return writeText.mock.calls[0][0];
}

describe('AgentPrompt', () => {
  it('renders the title and description from the registry', () => {
    setupClipboard();

    renderAt(PAGE);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('never renders the prompt text', () => {
    setupClipboard();

    renderAt(PAGE);

    for (const option of options) {
      for (const paragraph of option.prompt.split('\n\n')) {
        expect(screen.queryByText(paragraph)).not.toBeInTheDocument();
      }
    }
  });

  it('copies the default prompt when no build method is in the URL', async () => {
    const writeText = setupClipboard();

    renderAt(PAGE);

    expect(await copiedTextAsync(writeText)).toBe(promptFor('build-locally'));
  });

  it('copies the EAS Build prompt for buildenv=build-with-eas', async () => {
    const writeText = setupClipboard();

    renderAt(`${PAGE}?buildenv=build-with-eas`);

    expect(await copiedTextAsync(writeText)).toBe(promptFor('build-with-eas'));
  });

  it('copies the local EAS CLI prompt for buildenv=eas-cli-local', async () => {
    const writeText = setupClipboard();

    renderAt(`${PAGE}?buildenv=eas-cli-local`);

    expect(await copiedTextAsync(writeText)).toBe(promptFor('eas-cli-local'));
  });

  it('falls back to the default prompt for an unknown build method', async () => {
    const writeText = setupClipboard();

    renderAt(`${PAGE}?buildenv=nonsense`);

    expect(await copiedTextAsync(writeText)).toBe(promptFor('build-locally'));
  });

  it('copies the prompt with its paragraph breaks intact', async () => {
    const writeText = setupClipboard();

    renderAt(PAGE);

    expect(await copiedTextAsync(writeText)).toContain('\n\n');
  });

  it('shows copied feedback after copying', async () => {
    setupClipboard();

    renderAt(PAGE);
    fireEvent.click(screen.getByRole('button', { name: /copy prompt/i }));

    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('offers the selector from the registry', () => {
    setupClipboard();

    renderAt(PAGE);

    expect(screen.getByRole('combobox', { name: /build method/i })).toBeInTheDocument();
  });

  it('carries every option to the markdown twin', () => {
    setupClipboard();

    renderAt(PAGE);
    const block = screen.getByTestId('agent-prompt');

    expect(block).toHaveAttribute('data-md', 'agent-prompt');
    expect(JSON.parse(block.getAttribute('data-md-agent-prompt')!)).toEqual({
      title,
      description,
      prompts: options.map(({ label, prompt }) => ({ label, prompt })),
    });
  });

  it('has no axe violations', async () => {
    setupClipboard();

    const { container } = renderAt(PAGE);

    expect(await axe(container)).toHaveNoViolations();
  });
});
