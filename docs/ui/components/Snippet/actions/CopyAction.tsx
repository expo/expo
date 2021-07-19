import React from 'react';

import { SnippetAction, SnippetActionProps } from '../SnippetAction';

import { ClipboardIcon } from '~/ui/foundations/icons';

type CopyActionProps = SnippetActionProps & {
  text: string;
};

// TODO(cedric): add confirmation or feedback when the content is copied

export const CopyAction = ({ text, ...rest }: CopyActionProps) => {
  const onCopyClick = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <SnippetAction icon={<ClipboardIcon />} onClick={onCopyClick} {...rest}>
      Copy
    </SnippetAction>
  );
};
