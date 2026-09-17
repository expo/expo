import { Button, mergeClasses } from '@expo/styleguide';
import { TriangleDownIcon } from '@expo/styleguide-icons/custom/TriangleDownIcon';
import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import { MagicWand01Icon } from '@expo/styleguide-icons/outline/MagicWand01Icon';
import { motion } from 'framer-motion';
import { useRouter } from 'next/compat/router';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useCopy } from '~/common/useCopy';
import { Select } from '~/ui/components/Select';
import { CALLOUT, HEADLINE } from '~/ui/components/Text';

type AgentPromptProps = PropsWithChildren<{
  title: string;
  description: string;
  /** Prompt built at runtime, for callers that cannot author it as MDX. */
  prompt?: string;
  selectorLabel?: string;
  queryParam?: string;
  defaultOption?: string;
}>;

type AgentPromptOptionProps = PropsWithChildren<{
  id: string;
  label: string;
}>;

const SelectedOptionContext = createContext<string | undefined>(undefined);

function collectOptions(children: ReactNode) {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<AgentPromptOptionProps> =>
        isValidElement(child) && child.type === AgentPromptOption
    )
    .map(child => ({ id: child.props.id, label: child.props.label }));
}

function selectedPromptText(container: HTMLElement | null) {
  const code =
    container?.querySelector('[data-agent-prompt-option]:not([hidden]) pre code') ??
    container?.querySelector('pre code');
  return code?.textContent?.trimEnd() ?? '';
}

export function AgentPrompt({
  title,
  description,
  prompt,
  selectorLabel,
  queryParam,
  defaultOption,
  children,
}: AgentPromptProps) {
  const router = useRouter();
  const options = collectOptions(children);
  const fallbackId = defaultOption ?? options[0]?.id;
  const [localOptionId, setLocalOptionId] = useState(fallbackId);
  const [isOpen, setIsOpen] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const promptId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const { copiedIsVisible, onCopyAsync } = useCopy(
    () => prompt ?? selectedPromptText(contentRef.current)
  );

  const fromQuery = queryParam ? router?.query[queryParam] : undefined;
  const selectedId = queryParam
    ? (options.find(option => option.id === fromQuery)?.id ?? fallbackId)
    : localOptionId;

  function onToggle() {
    const nextIsOpen = !isOpen;

    setIsOpen(nextIsOpen);

    if (nextIsOpen) {
      setIsPromptVisible(true);
    }
  }

  function onSelectionChange(nextId: string) {
    setLocalOptionId(nextId);

    if (!queryParam) {
      return;
    }

    const nextQuery = { ...router?.query };

    if (nextId === fallbackId) {
      delete nextQuery[queryParam];
    } else {
      nextQuery[queryParam] = nextId;
    }

    void router?.push({ query: nextQuery }, undefined, { shallow: true });
  }

  return (
    <div
      data-testid="agent-prompt"
      className="mb-4 rounded-3xl border border-palette-purple7 bg-palette-purple3 px-4 py-3.5 shadow-xs">
      <div className={mergeClasses('flex flex-wrap items-center gap-3', 'sm:gap-4')}>
        <div className="flex min-w-0 flex-1 basis-80 gap-3">
          <MagicWand01Icon
            aria-hidden="true"
            className="mt-0.5 icon-md shrink-0 text-palette-purple11 max-sm:hidden"
          />
          <div>
            <HEADLINE tag="h2">{title}</HEADLINE>
            <CALLOUT theme="secondary" className="mt-0.5">
              {description}
            </CALLOUT>
          </div>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-3 max-sm:w-full">
          {options.length > 1 && (
            <div data-md="skip" className="max-sm:w-full">
              <Select
                className="max-w-full shrink-0 border-default bg-default sm:min-w-52 max-sm:w-full"
                value={selectedId}
                onValueChange={onSelectionChange}
                options={options}
                optionsLabel={selectorLabel}
                ariaLabel={selectorLabel}
              />
            </div>
          )}
          <Button
            theme="primary"
            size="sm"
            leftSlot={<ClipboardIcon aria-hidden="true" className="icon-sm" />}
            className="w-40 shrink-0 justify-center max-sm:w-full"
            onClick={() => void onCopyAsync()}>
            {copiedIsVisible ? 'Copied!' : 'Copy prompt'}
          </Button>
        </div>
        <span role="status" aria-live="polite" className="sr-only">
          {copiedIsVisible ? 'Prompt copied to clipboard' : ''}
        </span>
      </div>
      <div className="mt-3 border-t border-palette-purple6 pt-3">
        <button
          type="button"
          data-md="skip"
          aria-expanded={isOpen}
          aria-controls={promptId}
          onClick={onToggle}
          className={mergeClasses(
            'flex cursor-pointer items-center gap-1.5 rounded-md text-xs font-medium text-secondary',
            'hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link'
          )}>
          <TriangleDownIcon
            aria-hidden="true"
            className={mergeClasses(
              'icon-sm text-icon-default transition-transform duration-200',
              !isOpen && '-rotate-90'
            )}
          />
          {isOpen ? 'Hide prompt' : 'Show prompt'}
        </button>
        <motion.div
          id={promptId}
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0 }}
          transition={{ type: 'tween', duration: 0.2 }}
          onAnimationComplete={() => {
            setIsPromptVisible(isOpen);
          }}
          className="overflow-hidden">
          <div
            ref={contentRef}
            hidden={!isPromptVisible}
            className="mt-3 [&_.code-block-wrapper]:my-0">
            {prompt ? (
              <div className="code-block-wrapper overflow-clip rounded-3xl border border-secondary bg-subtle">
                <pre className="relative max-h-96 overflow-auto wrap-break-word whitespace-pre-wrap">
                  <div className="p-4">
                    <code className="text-xs text-default">{prompt}</code>
                  </div>
                </pre>
              </div>
            ) : (
              <SelectedOptionContext.Provider value={selectedId}>
                {children}
              </SelectedOptionContext.Provider>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function AgentPromptOption({ id, label, children }: AgentPromptOptionProps) {
  const selectedId = useContext(SelectedOptionContext);

  return (
    <section data-agent-prompt-option={id} hidden={selectedId !== id}>
      <h3 className="sr-only">{label}</h3>
      {children}
    </section>
  );
}
