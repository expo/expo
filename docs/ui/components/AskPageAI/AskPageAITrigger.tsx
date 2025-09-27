import { Button, mergeClasses } from '@expo/styleguide';
import { Stars03DuotoneIcon } from '@expo/styleguide-icons/duotone/Stars03DuotoneIcon';

import { FOOTNOTE } from '../Text';
import * as Tooltip from '../Tooltip';

type AskPageAITriggerProps = {
  onClick: () => void;
  isActive?: boolean;
};

export function AskPageAITrigger({ onClick, isActive = false }: AskPageAITriggerProps) {
  return (
    <Tooltip.Root delayDuration={500}>
      <Tooltip.Trigger asChild>
        <Button
          type="button"
          theme="quaternary"
          className={mergeClasses(
            'min-h-[48px] min-w-[60px] justify-center px-2 max-xl-gutters:min-h-[unset]',
            isActive && 'border border-default bg-element'
          )}
          onClick={onClick}
          aria-pressed={isActive}
          aria-label="Ask about this page with AI">
          <div
            className={mergeClasses(
              'flex flex-col items-center',
              'max-xl-gutters:flex-row max-xl-gutters:gap-1.5'
            )}>
            <Stars03DuotoneIcon className="mt-0.5 text-icon-secondary" />
            <FOOTNOTE crawlable={false} theme="secondary">
              Ask AI
            </FOOTNOTE>
          </div>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content sideOffset={8} className="max-w-[300px] text-center">
        <FOOTNOTE>Open the contextual AI assistant for this SDK page</FOOTNOTE>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

export function AskPageAIConfigTrigger({ onClick, isActive = false }: AskPageAITriggerProps) {
  return (
    <Tooltip.Root delayDuration={500}>
      <Tooltip.Trigger asChild>
        <Button
          type="button"
          theme="quaternary"
          className={mergeClasses(
            'min-h-[36px] justify-center px-2.5',
            isActive && 'border border-default bg-element'
          )}
          onClick={onClick}
          aria-pressed={isActive}
          aria-label="Ask about this configuration page with AI">
          <div className="flex items-center gap-2">
            <Stars03DuotoneIcon className="icon-sm text-icon-secondary" />
            <FOOTNOTE crawlable={false} theme="secondary">
              Ask AI
            </FOOTNOTE>
          </div>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content sideOffset={8} className="max-w-[300px] text-center">
        <FOOTNOTE>Open the contextual AI assistant for this configuration reference</FOOTNOTE>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
