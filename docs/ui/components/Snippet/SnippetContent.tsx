import { mergeClasses, Themes } from '@expo/styleguide';
import { forwardRef, PropsWithChildren } from 'react';

import { useCodeBlockSettingsContext } from '~/providers/CodeBlockSettingsProvider';

export type SnippetContentProps = PropsWithChildren<{
  alwaysDark?: boolean;
  hideOverflow?: boolean;
  className?: string;
}>;

export const SnippetContent = forwardRef<HTMLDivElement, SnippetContentProps>(
  ({ children, className, alwaysDark = false, hideOverflow = false }: SnippetContentProps, ref) => {
    const { preferredTheme, wordWrap } = useCodeBlockSettingsContext();

    return (
      <div
        ref={ref}
        data-md={alwaysDark ? 'code-block' : undefined}
        className={mergeClasses(
          preferredTheme === Themes.DARK && 'dark-theme',
          wordWrap && 'wrap-break-word! whitespace-pre-wrap!',
          'relative overflow-x-auto rounded-b-md border border-default bg-subtle p-4 leading-4.5! text-default',
          'prose-code:px-0!',
          alwaysDark && 'dark-theme border-transparent bg-palette-black whitespace-nowrap',
          hideOverflow && 'overflow-hidden prose-code:whitespace-nowrap!',
          className
        )}>
        {children}
      </div>
    );
  }
);
