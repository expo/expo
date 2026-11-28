import { Button } from '@expo/styleguide';
import { Star04Icon } from '@expo/styleguide-icons/outline/Star04Icon';

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
          size="2xs"
          className="h-auto border-0 px-0 hocus:bg-transparent hocus:opacity-80"
          onClick={onClick}
          aria-pressed={isActive}
          aria-label="Ask AI about this page">
          <div className="flex items-center gap-1">
            <Star04Icon aria-hidden="true" className="icon-xs text-icon-default" />
            <FOOTNOTE crawlable={false} theme="secondary" className="leading-[1.6]">
              Ask AI
            </FOOTNOTE>
          </div>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content sideOffset={8} className="max-w-75 text-center">
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
          size="2xs"
          className="h-auto border-0 px-0 hocus:bg-transparent hocus:opacity-80"
          onClick={onClick}
          aria-pressed={isActive}
          aria-label="Ask AI about this configuration page">
          <div className="flex items-center gap-1">
            <Star04Icon aria-hidden="true" className="icon-xs text-icon-default" />
            <FOOTNOTE crawlable={false} theme="secondary" className="leading-[1.6]">
              Ask AI
            </FOOTNOTE>
          </div>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content sideOffset={8} className="max-w-75 text-center">
        <FOOTNOTE>Open the contextual AI assistant for this configuration reference</FOOTNOTE>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
