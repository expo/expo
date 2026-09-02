import { mergeClasses } from '@expo/styleguide';

export function AskPageAILoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className={mergeClasses(
        'fixed right-4 bottom-4 z-120 flex flex-col items-center justify-center gap-3 rounded-2xl border border-default bg-default py-10 shadow-xl',
        'w-[min(420px,calc(100vw-24px))]'
      )}>
      <span className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent text-icon-secondary" />
      <span className="text-sm text-secondary">Loading Ask AI…</span>
    </div>
  );
}
