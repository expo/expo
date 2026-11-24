import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { Copy03Icon } from '@expo/styleguide-icons/outline/Copy03Icon';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Fragment, useState } from 'react';

import { useCopy } from '~/common/useCopy';
import { SectionHeader } from '~/ui/components/Home/components';

type Command = {
  command: string;
  comment: string;
};

type SetupTab = {
  label: string;
  commands: Command[];
};

const SETUP_TABS: SetupTab[] = [
  {
    label: 'CLI',
    commands: [
      {
        command: 'npx create-expo-app@latest --template default@sdk-58',
        comment: '// Get a new project started',
      },
      { command: 'npx expo start', comment: '// Start your project' },
      { command: 'npx testflight', comment: '// Deploy to TestFlight' },
    ],
  },
  {
    label: 'Agent prompts',
    commands: [
      {
        command: 'claude plugin install expo@claude-plugins-official',
        comment: '// Add Expo to Claude Code',
      },
      { command: 'codex plugin add expo@openai-curated', comment: '// Add Expo to Codex' },
      { command: 'grok plugin install expo --trust', comment: '// Add Expo to Grok Build' },
    ],
  },
  {
    label: 'Services',
    commands: [
      { command: 'npx testflight', comment: '// Deploy to TestFlight' },
      { command: 'npx eas-cli deploy', comment: '// Deploy your web app' },
    ],
  },
];

function getCommandsText(tab: SetupTab) {
  return tab.commands.map(({ command }) => command).join('\n');
}

export function SetupExpo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { copiedIsVisible, onCopyAsync } = useCopy(() => getCommandsText(SETUP_TABS[activeIndex]));

  return (
    <>
      <SectionHeader
        title="Setup Expo"
        description="Get started with expo in a few commands and prompts"
      />
      <TabsPrimitive.Root
        data-md="tabs"
        value={String(activeIndex)}
        onValueChange={value => {
          setActiveIndex(Number(value));
        }}
        className="relative flex flex-col rounded-lg bg-[#fbfcfd] outline-(--expo-theme-border-default) outline-[0.5px] outline-offset-[-0.5px] dark:bg-screen">
        <TabsPrimitive.List
          className="flex items-center gap-4 px-4"
          style={{ boxShadow: 'inset 0 -0.5px 0 var(--expo-theme-border-secondary)' }}>
          {SETUP_TABS.map(({ label }, index) => (
            <TabsPrimitive.Trigger
              key={label}
              value={String(index)}
              className="flex h-11 items-start border-b-2 border-transparent pt-3 text-sm leading-[1.4] font-medium text-secondary dark:data-[state=active]:border-palette-white data-[state=active]:border-palette-black data-[state=active]:text-default">
              {label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        {SETUP_TABS.map((tab, index) => (
          <TabsPrimitive.Content
            key={tab.label}
            value={String(index)}
            forceMount
            hidden={index !== activeIndex}
            className="p-4">
            <pre className="m-0 overflow-x-auto bg-transparent p-0 text-sm leading-[1.4] tracking-[-0.42px] text-default">
              <code>
                {tab.commands.map(({ command, comment }, commandIndex) => (
                  <Fragment key={command}>
                    {commandIndex > 0 && '\n\n'}
                    {command} <span className="text-secondary">{comment}</span>
                  </Fragment>
                ))}
              </code>
            </pre>
          </TabsPrimitive.Content>
        ))}
        <button
          type="button"
          onClick={onCopyAsync}
          aria-label={copiedIsVisible ? 'Copied' : 'Copy commands'}
          className="absolute top-1.75 right-1.75 flex items-center rounded-sm p-2 hocus:bg-element">
          {copiedIsVisible ? (
            <CheckIcon aria-hidden="true" className="icon-xs text-icon-success" />
          ) : (
            <Copy03Icon aria-hidden="true" className="icon-xs text-icon-default" />
          )}
        </button>
      </TabsPrimitive.Root>
    </>
  );
}
