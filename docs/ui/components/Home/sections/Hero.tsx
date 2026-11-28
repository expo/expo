import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { Copy02Icon } from '@expo/styleguide-icons/outline/Copy02Icon';

import { useCopy } from '~/common/useCopy';
import { AGENT_LOGOS, DecorativeBand } from '~/ui/components/Home/resources';

const AGENT_PROMPT_LABEL = 'Teach your agent how to use Expo: ';
const AGENT_PROMPT_PATH = 'expo-skills/get-started.md';

export function Hero() {
  const { copiedIsVisible, onCopyAsync } = useCopy(AGENT_PROMPT_LABEL + AGENT_PROMPT_PATH);

  return (
    <>
      <DecorativeBand />
      <div className="mx-auto flex max-w-140.5 flex-col items-center gap-6 pb-20 text-center">
        <h1 className="heading-4xl text-default">Expo Docs</h1>
        <p className="text-base leading-[1.4] font-medium text-secondary">
          Expo provides agentic mobile infrastructure for application software. Build with our CLI
          and dev tools. Close the loop on agent-written code.
        </p>
        <button
          type="button"
          onClick={onCopyAsync}
          aria-label={
            copiedIsVisible ? 'Copied' : `Copy: ${AGENT_PROMPT_LABEL}${AGENT_PROMPT_PATH}`
          }
          className="flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-subtle px-4 outline-(--expo-theme-border-default) outline-[0.5px] outline-offset-[-0.5px] hocus:bg-element max-md:max-w-full">
          <span className="flex shrink-0">
            {AGENT_LOGOS.map(src => (
              <img
                key={src}
                src={src}
                alt=""
                width={20}
                height={20}
                className="size-5 rounded-full not-first:-ml-1"
              />
            ))}
          </span>
          <code className="text-xs leading-tight font-normal whitespace-nowrap text-secondary max-md:truncate">
            {AGENT_PROMPT_LABEL}
            <span className="text-default">{AGENT_PROMPT_PATH}</span>
          </code>
          {copiedIsVisible ? (
            <CheckIcon aria-hidden="true" className="icon-xs shrink-0 text-icon-success" />
          ) : (
            <Copy02Icon aria-hidden="true" className="icon-xs shrink-0 text-icon-tertiary" />
          )}
        </button>
      </div>
    </>
  );
}
