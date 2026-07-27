import { Button, mergeClasses } from '@expo/styleguide';
import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import { MagicWand01Icon } from '@expo/styleguide-icons/outline/MagicWand01Icon';
import { useMemo } from 'react';

import { useCopy } from '~/common/useCopy';
import { CALLOUT, FOOTNOTE } from '~/ui/components/Text';

import { buildNativeUpgradePrompt } from './buildUpgradePrompt';

type NativeUpgradePromptCalloutProps = {
  fromVersion: string;
  toVersion: string;
  diff?: string;
};

export function NativeUpgradePromptCallout({
  fromVersion,
  toVersion,
  diff,
}: NativeUpgradePromptCalloutProps) {
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?fromSdk=${fromVersion}&toSdk=${toVersion}`
      : undefined;
  const prompt = useMemo(
    () => (diff ? buildNativeUpgradePrompt({ from: fromVersion, to: toVersion, diff, url }) : ''),
    [fromVersion, toVersion, diff, url]
  );
  const { copiedIsVisible, onCopyAsync } = useCopy(prompt);

  if (!diff) {
    return null;
  }

  return (
    <div
      data-md="skip"
      className={mergeClasses(
        'mb-4 flex flex-col gap-3 rounded-md border border-info bg-info px-4 py-3 shadow-xs',
        'sm:flex-row sm:items-center sm:gap-4'
      )}>
      <div className="flex gap-3 sm:flex-1">
        <MagicWand01Icon aria-hidden="true" className="mt-0.5 icon-sm shrink-0 text-info" />
        <div>
          <CALLOUT weight="medium">Upgrading with an AI agent?</CALLOUT>
          <FOOTNOTE theme="secondary" className="mt-1 block text-sm">
            Copy a ready-to-run prompt with the full diff and apply instructions, then paste it into
            your AI assistant to update your native projects configuration.
          </FOOTNOTE>
        </div>
      </div>
      <Button
        theme="primary"
        size="sm"
        leftSlot={<ClipboardIcon aria-hidden="true" className="icon-sm" />}
        className="shrink-0 justify-center border-palette-blue11 bg-palette-blue11 text-palette-blue1 dark:border-palette-blue9 dark:bg-palette-blue9 dark:text-palette-blue2 dark:hocus:bg-palette-blue9 hocus:bg-palette-blue11 max-sm:w-full"
        onClick={() => void onCopyAsync()}>
        {copiedIsVisible ? 'Copied!' : 'Copy prompt'}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copiedIsVisible ? 'Prompt copied to clipboard' : ''}
      </span>
    </div>
  );
}
