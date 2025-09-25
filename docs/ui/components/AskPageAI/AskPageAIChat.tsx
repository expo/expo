import { Button, mergeClasses, DocsLogo } from '@expo/styleguide';
import { Stars03DuotoneIcon } from '@expo/styleguide-icons/duotone/Stars03DuotoneIcon';
import { Send03Icon } from '@expo/styleguide-icons/outline/Send03Icon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { type FormEvent } from 'react';

import { FOOTNOTE, RawH5 } from '../Text';

type AskPageAIChatProps = {
  onClose: () => void;
  pageTitle?: string;
};

export function AskPageAIChat({ onClose, pageTitle }: AskPageAIChatProps) {
  const contextLabel = pageTitle?.trim() ? pageTitle : 'This page';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="flex h-full flex-col bg-default">
      <div className="flex items-center justify-between border-b border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={mergeClasses(
              'inline-flex size-8 items-center justify-center rounded-full bg-element shadow-xs'
            )}>
            <Stars03DuotoneIcon className="icon-sm text-icon-default" />
          </span>
          <RawH5 className="!my-0">AI Assistant</RawH5>
        </div>
        <Button
          aria-label="Close Ask AI assistant"
          theme="quaternary"
          size="xs"
          className="px-2"
          onClick={onClose}>
          <XIcon className="icon-xs text-icon-secondary" />
        </Button>
      </div>
      <div className="mt-auto px-4 pb-5 pt-4">
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-default bg-subtle px-3 py-2 shadow-xs">
          <DocsLogo className="icon-sm text-icon-secondary" />
          <FOOTNOTE theme="secondary">{contextLabel}</FOOTNOTE>
        </div>
        <form
          className="flex items-center gap-3 rounded-full border border-default bg-default px-4 py-2 shadow-xs"
          onSubmit={handleSubmit}
          aria-label="Ask AI form">
          <textarea
            aria-label="Ask AI about this page"
            className="flex-1 resize-none bg-transparent text-default outline-none"
            rows={1}
          />
          <Button
            type="submit"
            theme="quaternary"
            size="sm"
            className="flex size-9 items-center justify-center rounded-full !p-0"
            disabled>
            <Send03Icon className="icon-sm text-icon-default" />
          </Button>
        </form>
      </div>
    </div>
  );
}
