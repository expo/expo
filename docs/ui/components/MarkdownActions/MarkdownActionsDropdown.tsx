import { Button } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { Copy04Icon } from '@expo/styleguide-icons/outline/Copy04Icon';
import { useRouter } from 'next/compat/router';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

import {
  ClaudeCodeLogoIcon,
  ClaudeLogoIcon,
  CodexLogoIcon,
  CursorLogoIcon,
  OpenAILogoIcon,
} from '~/ui/components/CustomIcons/AIProviderIcons';
import { MarkdownIcon } from '~/ui/components/CustomIcons/MarkdownIcon';
import * as Dropdown from '~/ui/components/Dropdown';
import { FOOTNOTE } from '~/ui/components/Text';

import { getVersionedMarkdownPath } from './paths';

const getPrompt = (url: string) =>
  encodeURIComponent(`Read this documentation page, so I can ask questions about it:\n\n${url}`);

export function MarkdownActionsDropdown() {
  const router = useRouter();
  const intl = useIntl();

  const pathname = router?.pathname;
  const asPath = router?.asPath;

  const pagePath = asPath ?? pathname;
  const markdownViewUrl = useMemo(() => {
    if (!pagePath) {
      return null;
    }

    const versionedPath = getVersionedMarkdownPath(pagePath);
    if (versionedPath) {
      return versionedPath;
    }

    const path = pagePath.split(/[#?]/)[0].replace(/\/$/, '');
    if (!path || path === '/') {
      return '/index.md';
    }
    if (path.endsWith('.md')) {
      return path;
    }
    return path.endsWith('/index') ? `${path}.md` : `${path}/index.md`;
  }, [pagePath]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!markdownViewUrl) {
      return;
    }

    try {
      const response = await fetch(markdownViewUrl);
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
  }, [markdownViewUrl]);

  const markdownUrl = useMemo(() => {
    if (!markdownViewUrl) {
      return null;
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${markdownViewUrl}`;
    }

    return `https://docs.expo.dev${markdownViewUrl}`;
  }, [markdownViewUrl]);

  const chatGptUrl = useMemo(() => {
    if (!markdownUrl) {
      return null;
    }
    return `https://chat.openai.com/?q=${getPrompt(markdownUrl)}`;
  }, [markdownUrl]);

  const codexUrl = useMemo(() => {
    if (!markdownUrl) {
      return null;
    }
    return `codex://new?prompt=${getPrompt(markdownUrl)}`;
  }, [markdownUrl]);

  const claudeUrl = useMemo(() => {
    if (!markdownUrl) {
      return null;
    }
    return `https://claude.ai/new?q=${getPrompt(markdownUrl)}`;
  }, [markdownUrl]);

  const claudeCodeUrl = useMemo(() => {
    if (!markdownUrl) {
      return null;
    }
    return `claude-cli://open?q=${getPrompt(markdownUrl)}`;
  }, [markdownUrl]);

  const cursorUrl = useMemo(() => {
    if (!markdownUrl) {
      return null;
    }
    return `https://cursor.com/link/prompt?text=${getPrompt(markdownUrl)}`;
  }, [markdownUrl]);

  const dropdownItems = [];

  if (markdownViewUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="copy-markdown"
        label={intl.formatMessage({ id: 'copyMarkdown' })}
        Icon={Copy04Icon}
        onSelect={handleCopyMarkdown}
      />
    );
  }

  if (markdownViewUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="view-markdown"
        label={intl.formatMessage({ id: 'viewMarkdown' })}
        Icon={MarkdownIcon}
        href={markdownViewUrl}
        openInNewTab
      />
    );
  }

  if (chatGptUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="open-chatgpt"
        label={intl.formatMessage({ id: 'openIn' }, { provider: 'ChatGPT' })}
        Icon={OpenAILogoIcon}
        href={chatGptUrl}
        openInNewTab
      />
    );
  }

  if (codexUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="open-codex"
        label={intl.formatMessage({ id: 'openIn' }, { provider: 'Codex' })}
        Icon={CodexLogoIcon}
        href={codexUrl}
        openInNewTab={false}
      />
    );
  }

  if (claudeUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="open-claude"
        label={intl.formatMessage({ id: 'openIn' }, { provider: 'Claude' })}
        Icon={ClaudeLogoIcon}
        href={claudeUrl}
        openInNewTab
      />
    );
  }

  if (claudeCodeUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="open-claude-code"
        label={intl.formatMessage({ id: 'openIn' }, { provider: 'Claude Code' })}
        Icon={ClaudeCodeLogoIcon}
        href={claudeCodeUrl}
        openInNewTab={false}
      />
    );
  }

  if (cursorUrl) {
    dropdownItems.push(
      <Dropdown.Item
        key="open-cursor"
        label={intl.formatMessage({ id: 'openIn' }, { provider: 'Cursor' })}
        Icon={CursorLogoIcon}
        href={cursorUrl}
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
      className="justify-center pr-2 pl-2.5"
      aria-haspopup="menu"
      aria-label={intl.formatMessage({ id: 'copyPageActions' })}>
      <div className="flex flex-row items-center gap-1.5">
        <Copy04Icon aria-hidden="true" className="icon-xs text-icon-secondary" />
        <FOOTNOTE crawlable={false} theme="secondary" className="whitespace-nowrap">
          {intl.formatMessage({ id: 'copyPage' })}
        </FOOTNOTE>
        <ChevronDownIcon aria-hidden="true" className="icon-xs text-icon-secondary" />
      </div>
    </Button>
  );

  return <Dropdown.Dropdown trigger={dropdownTrigger}>{dropdownItems}</Dropdown.Dropdown>;
}
