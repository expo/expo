import { ClipboardIcon } from '@expo/styleguide-icons/outline/ClipboardIcon';
import { useState } from 'react';

import { SnippetAction, SnippetActionProps } from '../SnippetAction';

type CopyActionProps = SnippetActionProps & {
  text: string;
};

export const CopyAction = ({ text, ...rest }: CopyActionProps) => {
  const [copyDone, setCopyDone] = useState(false);
  const onCopyClick = () => {
    const filteredText = text
      .split('\n')
      .filter(line => !/^\s*\/\*.*@tutinfo.*\*\/\s*$/.test(line))
      .map(line => line.replace(/\/\*.*@tutinfo.*\*\/|\/\/.*@tutinfo.*/g, '').trimEnd())
      .join('\n');

    navigator.clipboard?.writeText(filteredText);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1500);
  };

  return (
    <SnippetAction
      leftSlot={<ClipboardIcon className="icon-sm text-icon-default" />}
      onClick={onCopyClick}
      disabled={copyDone}
      {...rest}>
      {copyDone ? 'Copied!' : 'Copy'}
    </SnippetAction>
  );
};
