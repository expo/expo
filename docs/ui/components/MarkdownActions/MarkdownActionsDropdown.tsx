import { Button } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { Copy04Icon } from '@expo/styleguide-icons/outline/Copy04Icon';
import { useRouter } from 'next/compat/router';
import { useCallback, useMemo } from 'react';

import { ClaudeLogoIcon, OpenAILogoIcon } from '~/ui/components/CustomIcons/AIProviderIcons';
import * as Dropdown from '~/ui/components/Dropdown';
import { githubRawUrl, getPageMdxFilePath } from '~/ui/components/Footer/utils';
import { prepareMarkdownForCopyAsync } from '~/ui/components/MarkdownActions/processMarkdown';
import { FOOTNOTE } from '~/ui/components/Text';

const getPrompt = (url: string) =>
  encodeURIComponent(`Read from ${url} so I can ask questions about it.`);

export function MarkdownActionsDropdown() {
  const router = useRouter();

  const pathname = router?.pathname;
  const asPath = router?.asPath;

  const rawMarkdownUrl = useMemo(() => {
    if (!pathname) {
      return null;
    }

    const filePath = getPageMdxFilePath(pathname);
    if (!filePath) {
      return null;
    }

    return githubRawUrl(pathname);
  }, [pathname]);

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

      const preparedMarkdown = await prepareMarkdownForCopyAsync(markdown, {
        path: asPath ?? pathname ?? '',
      });
      await navigator.clipboard.writeText(preparedMarkdown);
    } catch (error) {
      console.error('Unable to copy markdown content', error);
    }
  }, [rawMarkdownUrl, asPath, pathname]);

  const pagePath = asPath ?? pathname;

  const pageUrl = useMemo(() => {
    if (!pagePath) {
      return null;
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${pagePath}`;
    }

    return `https://docs.expo.dev${pagePath}`;
  }, [pagePath]);

  const chatGptUrl = useMemo(() => {
    if (!pageUrl) {
      return null;
    }
    return `https://chat.openai.com/?q=${getPrompt(pageUrl)}`;
  }, [pageUrl]);

  const claudeUrl = useMemo(() => {
    if (!pageUrl) {
      return null;
    }
    return `https://claude.ai/new?q=${getPrompt(pageUrl)}`;
  }, [pageUrl]);

  const dropdownItems = [];

  if (rawMarkdownUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="copy-markdown"
        label="Copy Markdown"
        Icon={Copy04Icon}
        onSelect={handleCopyMarkdown}
      />
    );
  }

  if (chatGptUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="open-chatgpt"
        label="Open in ChatGPT"
        Icon={OpenAILogoIcon}
        href={chatGptUrl}
        openInNewTab
      />
    );
  }

  if (claudeUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="open-claude"
        label="Open in Claude"
        Icon={ClaudeLogoIcon}
        href={claudeUrl}
        openInNewTab
      />
    );
  }

  if (dropdownItems.length === 0) {
    return null;
  }

  const dropdownTrigger = (
    <Button
      theme="quaternary"
      className="justify-center pl-2.5 pr-2"
      aria-haspopup="menu"
      aria-label="Copy page actions">
      <div className="flex flex-row items-center gap-1.5">
        <Copy04Icon className="icon-xs text-icon-secondary" />
        <FOOTNOTE crawlable={false} theme="secondary" className="whitespace-nowrap">
          Copy page
        </FOOTNOTE>
        <ChevronDownIcon className="icon-xs text-icon-secondary" />
      </div>
    </Button>
  );

  return <Dropdown.Dropdown trigger={dropdownTrigger}>{dropdownItems}</Dropdown.Dropdown>;
}
