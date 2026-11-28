import { mergeClasses } from '@expo/styleguide';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { Copy03Icon } from '@expo/styleguide-icons/outline/Copy03Icon';
import { useRouter } from 'next/compat/router';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useCopy } from '~/common/useCopy';
import {
  ClaudeCodeLogoIcon,
  ClaudeLogoIcon,
  CodexLogoIcon,
  CursorLogoIcon,
  OpenAILogoIcon,
} from '~/ui/components/CustomIcons/AIProviderIcons';
import { MarkdownIcon } from '~/ui/components/CustomIcons/MarkdownIcon';
import * as Dropdown from '~/ui/components/Dropdown';

import { getMarkdownFilePath } from './paths';

const getPrompt = (url: string) =>
  encodeURIComponent(`Read this documentation page, so I can ask questions about it:\n\n${url}`);

const PILL_BUTTON_CLASSES =
  'flex items-center rounded-full focus-visible:ring-2 focus-visible:ring-link focus-visible:outline-none hocus:opacity-80';

type Props = {
  isSplit?: boolean;
};

export function MarkdownActionsDropdown({ isSplit = false }: Props) {
  const router = useRouter();
  const intl = useIntl();

  const pathname = router?.pathname;
  const asPath = router?.asPath;

  const pagePath = asPath ?? pathname;
  const { copiedIsVisible, onCopyAsync } = useCopy(() => window.location.href);
  const markdownViewUrl = useMemo(() => getMarkdownFilePath(pagePath), [pagePath]);

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
        Icon={Copy03Icon}
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

  return (
    <div
      className={mergeClasses(
        'flex shrink-0 items-center rounded-[30px] outline-(--expo-theme-border-default) outline-[0.5px] outline-offset-[-0.5px]',
        isSplit ? 'h-6.75 gap-1.5 pr-2 pl-3' : 'gap-1 px-3 py-1'
      )}>
      <button
        type="button"
        onClick={onCopyAsync}
        className={mergeClasses(PILL_BUTTON_CLASSES, isSplit ? 'gap-1.5' : 'gap-1')}>
        {copiedIsVisible ? (
          <CheckIcon aria-hidden="true" className="icon-2xs text-icon-success" />
        ) : (
          <Copy03Icon aria-hidden="true" className="icon-2xs text-icon-default" />
        )}
        <span className="text-xs leading-[1.6] font-medium whitespace-nowrap text-secondary">
          {intl.formatMessage({ id: 'copyLink', defaultMessage: 'Copy link' })}
        </span>
      </button>
      {isSplit && <span aria-hidden="true" className="h-full border-l-0.5 border-default" />}
      <Dropdown.Dropdown
        alignOffset={isSplit ? -8 : -12}
        sideOffset={14.5}
        trigger={
          <button
            type="button"
            className={PILL_BUTTON_CLASSES}
            aria-haspopup="menu"
            aria-label={intl.formatMessage({ id: 'copyPageActions' })}>
            <ChevronDownIcon aria-hidden="true" className="icon-2xs text-icon-default" />
          </button>
        }>
        {dropdownItems}
      </Dropdown.Dropdown>
    </div>
  );
}
