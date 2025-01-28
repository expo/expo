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
          wordWrap && '!break-words !whitespace-pre-wrap',
          'relative overflow-x-auto rounded-b-md border border-default bg-subtle p-4 !leading-[18px] text-default',
          'prose-code:!px-0',
          alwaysDark && 'dark-theme whitespace-nowrap border-transparent bg-palette-black',
          hideOverflow && 'overflow-hidden prose-code:!whitespace-nowrap',
          className
        )}>
        {children}
      </div>
    );
  }
);
