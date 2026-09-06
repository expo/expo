import { Button, mergeClasses } from '@expo/styleguide';
import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import { MagicWand01Icon } from '@expo/styleguide-icons/outline/MagicWand01Icon';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { useCopy } from '~/common/useCopy';
import { Select } from '~/ui/components/Select';
import { CALLOUT, HEADLINE } from '~/ui/components/Text';

import { AGENT_PROMPTS, type AgentPromptPage, type AgentPromptPageId } from './prompts';

type AgentPromptProps = {
  page: AgentPromptPageId;
};

export function AgentPrompt({ page }: AgentPromptProps) {
  const config: AgentPromptPage = AGENT_PROMPTS[page];
  const { title, description, selectorLabel, queryParam, defaultOptionId, options, prompt } =
    config;

  const router = useRouter();
  const fallbackId = defaultOptionId ?? options?.[0]?.id;
  const [localOptionId, setLocalOptionId] = useState(fallbackId);

  const fromQuery = queryParam ? router.query[queryParam] : undefined;
  const selectedId = queryParam
    ? (options?.find(option => option.id === fromQuery)?.id ?? fallbackId)
    : localOptionId;

  const selected = options?.find(option => option.id === selectedId);
  const promptText = prompt ?? selected?.prompt ?? '';
  const { copiedIsVisible, onCopyAsync } = useCopy(promptText);

  const markdownPayload = JSON.stringify({
    title,
    description,
    prompts: options
      ? options.map(({ label, prompt }) => ({ label, prompt }))
      : [{ prompt: promptText }],
  });

  function onSelectionChange(nextId: string) {
    setLocalOptionId(nextId);

    if (!queryParam) {
      return;
    }

    const nextQuery = { ...router.query };

    if (nextId === defaultOptionId) {
      delete nextQuery[queryParam];
    } else {
      nextQuery[queryParam] = nextId;
    }

    void router.push({ query: nextQuery }, undefined, { shallow: true });
  }

  return (
    <div
      data-md="agent-prompt"
      data-md-agent-prompt={markdownPayload}
      data-testid="agent-prompt"
      className={mergeClasses(
        'mb-4 flex flex-wrap items-center gap-3 rounded-3xl border border-default bg-element px-4 py-3.5 shadow-xs',
        'sm:gap-4'
      )}>
      <div className="flex min-w-0 flex-1 basis-80 gap-3">
        <MagicWand01Icon
          aria-hidden="true"
          className="mt-0.5 icon-md shrink-0 text-icon-secondary"
        />
        <div>
          <HEADLINE>{title}</HEADLINE>
          <CALLOUT theme="secondary" className="mt-0.5">
            {description}
          </CALLOUT>
        </div>
      </div>
      <div className="flex max-w-full flex-wrap items-center gap-3 max-sm:w-full">
        {options && options.length > 1 && (
          <Select
            className="max-w-full shrink-0 border-secondary bg-default sm:min-w-52 max-sm:w-full"
            value={selectedId}
            onValueChange={onSelectionChange}
            options={options.map(({ id, label }) => ({ id, label }))}
            optionsLabel={selectorLabel}
            ariaLabel={selectorLabel}
          />
        )}
        <Button
          theme="primary"
          size="sm"
          leftSlot={<ClipboardIcon aria-hidden="true" className="icon-sm" />}
          className="min-w-36 shrink-0 justify-center max-sm:w-full"
          onClick={() => void onCopyAsync()}>
          {copiedIsVisible ? 'Copied!' : 'Copy prompt'}
        </Button>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {copiedIsVisible ? 'Prompt copied to clipboard' : ''}
      </span>
    </div>
  );
}
