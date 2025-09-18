import { Button } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { Copy04Icon } from '@expo/styleguide-icons/outline/Copy04Icon';
import { EyeIcon } from '@expo/styleguide-icons/outline/EyeIcon';
import { useRouter } from 'next/compat/router';
import { useCallback, useMemo } from 'react';

import * as Dropdown from '~/ui/components/Dropdown';
import { githubRawUrl, getPageMdxFilePath } from '~/ui/components/Footer/utils';
import { FOOTNOTE } from '~/ui/components/Text';

const getPrompt = (markdownUrl: string) =>
  encodeURIComponent(`Read from ${markdownUrl} so I can ask questions about it.`);

export function MarkdownActionsDropdown() {
  const router = useRouter();

  const pathname = router?.pathname;

  const filePath = useMemo(() => {
    if (!pathname) {
      return null;
    }

    const resolved = getPageMdxFilePath(pathname);
    return resolved ? resolved : null;
  }, [pathname]);

  const rawMarkdownUrl = useMemo(() => {
    if (!pathname || !filePath) {
      return null;
    }
    return githubRawUrl(pathname);
  }, [filePath, pathname]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!rawMarkdownUrl) {
      return;
    }

    try {
      const response = await fetch(rawMarkdownUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`);
      }

      const markdown = await response.text();

      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(markdown);
    } catch (error) {
      console.error('Unable to copy markdown content', error);
    }
  }, [rawMarkdownUrl]);

  const actionLabel = 'Copy as';
  const iconClassName = 'icon-xs text-icon-secondary';

  const chatGptUrl = useMemo(() => {
    if (!rawMarkdownUrl) {
      return null;
    }
    return `https://chat.openai.com/?q=${getPrompt(rawMarkdownUrl)}`;
  }, [rawMarkdownUrl]);

  const claudeUrl = useMemo(() => {
    if (!rawMarkdownUrl) {
      return null;
    }
    return `https://claude.ai/new?q=${getPrompt(rawMarkdownUrl)}`;
  }, [rawMarkdownUrl]);

  const dropdownTrigger = (
    <Button
      theme="quaternary"
      className="justify-center pl-2.5 pr-2"
      aria-haspopup="menu"
      aria-label="Copy as Markdown and AI actions">
      <div className="flex flex-row items-center gap-1.5">
        <FOOTNOTE crawlable={false} theme="secondary" className="whitespace-nowrap">
          {actionLabel}
        </FOOTNOTE>
        <ChevronDownIcon className={iconClassName} />
      </div>
    </Button>
  );

  return (
    <Dropdown.Dropdown trigger={<div>{dropdownTrigger}</div>} sideOffset={8}>
      <Dropdown.Item
        label="Copy as Markdown"
        Icon={Copy04Icon}
        onSelect={handleCopyMarkdown}
        disabled={!rawMarkdownUrl}
      />
      <Dropdown.Item
        label="View as Markdown"
        Icon={EyeIcon}
        href={rawMarkdownUrl ?? undefined}
        openInNewTab
        disabled={!rawMarkdownUrl}
      />
      <Dropdown.Item
        label="Open in ChatGPT"
        Icon={ArrowUpRightIcon}
        href={chatGptUrl ?? undefined}
        openInNewTab
        disabled={!chatGptUrl}
      />
      <Dropdown.Item
        label="Open in Claude"
        Icon={ArrowUpRightIcon}
        href={claudeUrl ?? undefined}
        openInNewTab
        disabled={!claudeUrl}
      />
    </Dropdown.Dropdown>
  );
}
