import { Button, mergeClasses } from '@expo/styleguide';
import { Star06Icon } from '@expo/styleguide-icons/outline/Star06Icon';

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
            'min-h-[48px] min-w-[60px] justify-center px-2 max-xl-gutters:min-h-[unset] border border-palette-purple7 hover:border-palette-purple8 focus:border-palette-purple8',
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
            <Star06Icon className="mt-0.5 text-palette-purple11" />
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
            'min-h-[36px] justify-center px-2.5 border border-palette-purple7 hover:border-palette-purple8 focus:border-palette-purple8',
            isActive && 'border border-default bg-element'
          )}
          onClick={onClick}
          aria-pressed={isActive}
          aria-label="Ask about this configuration page with AI">
          <div className="flex items-center gap-2">
            <Star06Icon className="icon-sm text-palette-purple11" />
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
