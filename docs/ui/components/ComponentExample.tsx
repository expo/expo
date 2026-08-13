import { useTheme } from '@expo/styleguide';
import { FileCode01Icon } from '@expo/styleguide-icons/outline/FileCode01Icon';
import { PropsWithChildren, useEffect, useState } from 'react';

import { cleanCopyValue, getCodeBlockDataFromChildren } from '~/common/code-utilities';
import { prefersDarkTheme } from '~/common/window';
import { usePageApiVersion } from '~/providers/page-api-version';
import { LightboxImage } from '~/ui/components/ContentSpotlight/LightboxImage';
import { Snippet } from '~/ui/components/Snippet/Snippet';
import { SnippetContent } from '~/ui/components/Snippet/SnippetContent';
import { SnippetHeader } from '~/ui/components/Snippet/SnippetHeader';
import { CopyAction } from '~/ui/components/Snippet/actions/CopyAction';
import { SettingsAction } from '~/ui/components/Snippet/actions/SettingsAction';

type Props = PropsWithChildren<{
  title: string;
  src: string;
  alt: string;
  darkSrc?: string;
}>;

/**
 * Shows a code example next to a screenshot of what it renders, in a single
 * snippet card: a full-width header with actions, code on the left, and the
 * image on the right, stacked on small screens. The screenshot switches
 * between `src` and `darkSrc` based on the active theme, and the fixed-aspect
 * image box reserves its space to avoid layout shifts.
 */
export function ComponentExample({ title, src, darkSrc, alt, children }: Props) {
  const { themeName } = useTheme();
  const context = usePageApiVersion();
  const [isDark, setDark] = useState(false);

  useEffect(() => {
    if (themeName === 'auto') {
      setDark(prefersDarkTheme());
    } else {
      setDark(themeName === 'dark');
    }
  }, [themeName]);

  const { value } = getCodeBlockDataFromChildren(children);
  const activeSrc = isDark && darkSrc ? darkSrc : src;

  return (
    <Snippet className="mb-4 flex flex-col prose-pre:m-0! prose-pre:rounded-none! prose-pre:border-0!">
      <div className="flex overflow-hidden rounded-md border border-default max-lg:flex-col">
        <div className="flex min-w-0 flex-1 flex-col [&>div:first-child]:rounded-none [&>div:first-child]:border-0 [&>div:first-child]:border-b [&>div:first-child]:border-default">
          <SnippetHeader title={title} Icon={FileCode01Icon}>
            <CopyAction text={cleanCopyValue(value, context.version)} />
            <SettingsAction />
          </SnippetHeader>
          <SnippetContent className="flex-1 rounded-none border-0 p-0">{children}</SnippetContent>
        </div>
        <div className="flex w-56 shrink-0 items-center justify-center border-l border-default bg-subtle p-4 max-lg:w-full max-lg:border-t max-lg:border-l-0">
          <div className="w-full max-w-52 overflow-hidden rounded-sm [&_button]:block [&_button]:w-full [&_button]:cursor-pointer">
            <LightboxImage
              src={activeSrc}
              alt={alt}
              width={1206}
              height={2622}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </Snippet>
  );
}
