import { Command } from 'cmdk';
import { useState } from 'react';

import { openLink } from '../utils';

import { Tag } from '~/ui/components/Tag';

type Props = {
  children: React.ReactNode;
  url: string;
  onSelect?: () => void;
  isExternalLink?: boolean;
  isNested?: boolean;
  // Props forwarded to Command.Item
  className?: string;
  value?: string;
};

/**
 * Wrapper for Command.Item that adds copy link on right/ middle click + visual copy indicator.
 */
export const CommandItemBase = ({
  children,
  url,
  isExternalLink,
  isNested,
  onSelect,
  className,
  value,
}: Props) => {
  const [copyDone, setCopyDone] = useState(false);

  const copyUrl = () => {
    navigator.clipboard?.writeText(url);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1500);
  };

  return (
    <Command.Item
      className={className}
      value={value}
      data-nested={isNested ? true : undefined}
      onMouseUp={event => {
        // middle click (typical *nix copy shortcut)
        if (event.button === 1) {
          copyUrl();
        }
      }}
      onSelect={() => {
        openLink(url, isExternalLink);
        onSelect && onSelect();
      }}
      onContextMenu={event => {
        event.preventDefault();
      }}
      onAuxClick={copyUrl}>
      {children}
      {copyDone && (
        <Tag
          name="Copied!"
          className="absolute right-2.5 top-[calc(50%-13px)] !m-0 !border-secondary !bg-default"
        />
      )}
    </Command.Item>
  );
};
