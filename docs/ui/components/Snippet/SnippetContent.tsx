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
          'border-default bg-subtle text-default relative overflow-x-auto rounded-b-md border p-4 leading-[18px]!',
          'prose-code:px-0!',
          alwaysDark && 'dark-theme bg-palette-black border-transparent whitespace-nowrap',
          hideOverflow && 'prose-code:whitespace-nowrap! overflow-hidden',
          className
        )}>
        {children}
      </div>
    );
  }
);
