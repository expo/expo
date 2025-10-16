import { Button } from '@expo/styleguide';
import { Send03Icon } from '@expo/styleguide-icons/outline/Send03Icon';
import type { FormEvent } from 'react';

type AskPageAIChatInputProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isBusy: boolean;
  conversationLength: number;
};

export function AskPageAIChatInput({
  question,
  onQuestionChange,
  onSubmit,
  isBusy,
  conversationLength,
}: AskPageAIChatInputProps) {
  return (
    <div className="mt-auto border-t border-default px-5 pb-6 pt-4">
      <form
        className="flex items-center gap-1 rounded-md border border-default bg-default px-2 py-1.5"
        onSubmit={onSubmit}
        aria-label="Ask AI form">
        <textarea
          aria-label="Ask AI about this page"
          className="min-h-[72px] flex-1 resize-none rounded-md border border-transparent bg-subtle p-2 text-sm leading-relaxed outline-none focus:!shadow-none focus:!outline-none focus:ring-0 focus-visible:!shadow-none focus-visible:!outline-none focus-visible:ring-0"
          rows={3}
          value={question}
          onChange={event => {
            onQuestionChange(event.target.value);
          }}
          disabled={isBusy && conversationLength === 0}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button
          type="submit"
          theme="quaternary"
          size="sm"
          className="flex size-6 items-center justify-center rounded-full !p-0"
          disabled={isBusy || question.trim().length === 0}>
          <Send03Icon className="icon-xs text-icon-default" />
        </Button>
      </form>
    </div>
  );
}
