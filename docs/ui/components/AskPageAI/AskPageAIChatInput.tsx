import { Button } from '@expo/styleguide';
import { ArrowCircleUpDuotoneIcon } from '@expo/styleguide-icons/duotone/ArrowCircleUpDuotoneIcon';
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
    <div className="border-default mt-auto border-t px-5 pt-4 pb-6">
      <form
        className="border-default bg-default flex items-center gap-1 rounded-md border px-2 py-1.5"
        onSubmit={onSubmit}
        aria-label="Ask AI form">
        <textarea
          aria-label="Ask AI about this page"
          placeholder="Ask about this page (Shift+Enter for newline)"
          className="bg-subtle placeholder:text-tertiary max-h-[160px] min-h-[64px] flex-1 resize-none overflow-y-auto rounded-md border border-transparent px-3 py-2 text-sm leading-relaxed outline-none focus:shadow-none! focus:ring-0 focus:outline-none! focus-visible:shadow-none! focus-visible:ring-0 focus-visible:outline-none!"
          rows={2}
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
          className="flex size-6 items-center justify-center rounded-full p-0!"
          disabled={isBusy || question.trim().length === 0}>
          <ArrowCircleUpDuotoneIcon className="icon-md text-icon-default" />
        </Button>
      </form>
    </div>
  );
}
