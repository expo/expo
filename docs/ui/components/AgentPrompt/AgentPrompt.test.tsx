import { jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
import type { ReactNode } from 'react';

import { axe } from '~/common/test-utilities';

import { AgentPrompt, AgentPromptOption } from '.';

jest.mock('next/router', () => mockRouter);

const SINGLE_PROMPT_PAGE = '/eas-update/getting-started/';
const DEVELOPMENT_BUILDS_PAGE = '/develop/development-builds/introduction/';
const DESCRIPTION = 'Paste this into Claude, Cursor, Codex, or another agent.';

const SINGLE_PROMPT =
  'Set up EAS Update in my Expo project.\n\nRun `npx expo install expo-updates`, then run `eas update:configure`.';
const LOCAL_PROMPT = 'Set up a development build and compile it on my machine.';
const EAS_PROMPT = 'Set up a development build and build it on EAS.';

function fence(text: string) {
  return (
    <div className="code-block-wrapper">
      <pre data-md-lang="text">
        <div>
          <code>{text}</code>
        </div>
      </pre>
    </div>
  );
}

function singlePrompt() {
  return (
    <AgentPrompt title="Set up EAS Update with an AI agent" description={DESCRIPTION}>
      {fence(SINGLE_PROMPT)}
    </AgentPrompt>
  );
}

function developmentBuildsPrompt() {
  return (
    <AgentPrompt
      title="Create a development build with an AI agent"
      description={DESCRIPTION}
      selectorLabel="Build method"
      queryParam="buildenv"
      defaultOption="build-locally">
      <AgentPromptOption id="build-locally" label="Build locally">
        {fence(LOCAL_PROMPT)}
      </AgentPromptOption>
      <AgentPromptOption id="build-with-eas" label="Build with EAS">
        {fence(EAS_PROMPT)}
      </AgentPromptOption>
    </AgentPrompt>
  );
}

const NATIVE_UPGRADE_PAGE = '/bare/upgrade/';
const RUNTIME_PROMPT =
  'Upgrade my Expo React Native project from SDK 52 to SDK 53.\n\ndiff --git a/android/app/build.gradle';

function runtimePrompt() {
  return (
    <AgentPrompt
      title="Upgrade your native project with an AI agent"
      description={DESCRIPTION}
      prompt={RUNTIME_PROMPT}
    />
  );
}

function setupClipboard() {
  const writeText = jest.fn();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

function renderAt(url: string, ui: ReactNode) {
  return render(<MemoryRouterProvider url={url}>{ui}</MemoryRouterProvider>);
}

async function copiedTextAsync(writeText: ReturnType<typeof setupClipboard>) {
  fireEvent.click(screen.getByRole('button', { name: /copy prompt/i }));
  await waitFor(() => {
    expect(writeText).toHaveBeenCalledTimes(1);
  });
  return writeText.mock.calls[0][0];
}

describe('AgentPrompt', () => {
  it('renders the title as a heading and the description', () => {
    setupClipboard();

    renderAt(SINGLE_PROMPT_PAGE, singlePrompt());

    expect(
      screen.getByRole('heading', { level: 2, name: 'Set up EAS Update with an AI agent' })
    ).toBeInTheDocument();
    expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
  });

  it('hides the prompt until the reader asks for it', () => {
    setupClipboard();

    renderAt(SINGLE_PROMPT_PAGE, singlePrompt());
    const code = screen.getByText(SINGLE_PROMPT, { normalizer: text => text });

    expect(code).not.toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /show prompt/i }));

    expect(code).toBeVisible();
    expect(screen.getByRole('button', { name: /hide prompt/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('copies the fenced prompt', async () => {
    const writeText = setupClipboard();

    renderAt(SINGLE_PROMPT_PAGE, singlePrompt());

    expect(await copiedTextAsync(writeText)).toBe(SINGLE_PROMPT);
  });

  it('shows copied feedback after copying', async () => {
    setupClipboard();

    renderAt(SINGLE_PROMPT_PAGE, singlePrompt());
    fireEvent.click(screen.getByRole('button', { name: /copy prompt/i }));

    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('renders no selector for a single prompt', () => {
    setupClipboard();

    renderAt(SINGLE_PROMPT_PAGE, singlePrompt());

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('keeps the toggle out of the markdown twin', () => {
    setupClipboard();

    renderAt(SINGLE_PROMPT_PAGE, singlePrompt());

    expect(screen.getByRole('button', { name: /show prompt/i })).toHaveAttribute('data-md', 'skip');
  });

  it('copies a runtime prompt given as a prop', async () => {
    const writeText = setupClipboard();

    renderAt(NATIVE_UPGRADE_PAGE, runtimePrompt());

    expect(await copiedTextAsync(writeText)).toBe(RUNTIME_PROMPT);
  });

  it('hides a runtime prompt until the reader asks for it', () => {
    setupClipboard();

    renderAt(NATIVE_UPGRADE_PAGE, runtimePrompt());
    const code = screen.getByText(RUNTIME_PROMPT, { normalizer: text => text });

    expect(code).not.toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /show prompt/i }));

    expect(code).toBeVisible();
  });

  it('has no axe violations', async () => {
    setupClipboard();

    const { container } = renderAt(SINGLE_PROMPT_PAGE, singlePrompt());

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('AgentPrompt with options', () => {
  it('offers the options in a selector', () => {
    setupClipboard();

    renderAt(DEVELOPMENT_BUILDS_PAGE, developmentBuildsPrompt());

    expect(screen.getByRole('combobox', { name: /build method/i })).toBeInTheDocument();
  });

  it('shows the default option and hides the others', () => {
    setupClipboard();

    renderAt(DEVELOPMENT_BUILDS_PAGE, developmentBuildsPrompt());
    fireEvent.click(screen.getByRole('button', { name: /show prompt/i }));

    expect(screen.getByText(LOCAL_PROMPT)).toBeVisible();
    expect(screen.getByText(EAS_PROMPT)).not.toBeVisible();
  });

  it('copies the default option when the URL names none', async () => {
    const writeText = setupClipboard();

    renderAt(DEVELOPMENT_BUILDS_PAGE, developmentBuildsPrompt());

    expect(await copiedTextAsync(writeText)).toBe(LOCAL_PROMPT);
  });

  it('copies the option named in the URL', async () => {
    const writeText = setupClipboard();

    renderAt(`${DEVELOPMENT_BUILDS_PAGE}?buildenv=build-with-eas`, developmentBuildsPrompt());

    expect(await copiedTextAsync(writeText)).toBe(EAS_PROMPT);
  });

  it('falls back to the default for an unknown option', async () => {
    const writeText = setupClipboard();

    renderAt(`${DEVELOPMENT_BUILDS_PAGE}?buildenv=nonsense`, developmentBuildsPrompt());

    expect(await copiedTextAsync(writeText)).toBe(LOCAL_PROMPT);
  });

  it('labels every option with a heading for the markdown twin', () => {
    setupClipboard();

    renderAt(DEVELOPMENT_BUILDS_PAGE, developmentBuildsPrompt());

    for (const label of ['Build locally', 'Build with EAS']) {
      expect(
        screen.getByRole('heading', { level: 3, name: label, hidden: true })
      ).toBeInTheDocument();
    }
  });

  it('has no axe violations', async () => {
    setupClipboard();

    const { container } = renderAt(DEVELOPMENT_BUILDS_PAGE, developmentBuildsPrompt());

    expect(await axe(container)).toHaveNoViolations();
  });
});
