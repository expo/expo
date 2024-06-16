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
        className={mergeClasses(
          preferredTheme === Themes.DARK && 'dark-theme',
          wordWrap && '!whitespace-pre-wrap !break-words',
          'relative text-default bg-subtle border border-default rounded-b-md overflow-x-auto p-4 !leading-[19px]',
          'prose-code:!px-0',
          alwaysDark && 'dark-theme bg-palette-black border-transparent whitespace-nowrap',
          hideOverflow && 'overflow-hidden prose-code:!whitespace-nowrap',
          className
        )}>
        {children}
      </div>
    );
  }
);
