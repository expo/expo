import { Copy02Icon } from '@expo/styleguide-icons/outline/Copy02Icon';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { SnippetAction, SnippetActionProps } from '../SnippetAction';

type CopyActionProps = SnippetActionProps & {
  text: string;
};

export const CopyAction = ({ text, ...rest }: CopyActionProps) => {
  const intl = useIntl();
  const [copyDone, setCopyDone] = useState(false);

  const onCopyClick = () => {
    void navigator.clipboard?.writeText(text);
    setCopyDone(true);
    setTimeout(() => {
      setCopyDone(false);
    }, 1500);
  };

  return (
    <SnippetAction
      leftSlot={<Copy02Icon aria-hidden="true" className="icon-xs text-button-quaternary-icon" />}
      onClick={onCopyClick}
      disabled={copyDone}
      className="px-2.75 max-sm:gap-0 [&_p]:max-sm:hidden"
      aria-label="Copy content"
      {...rest}>
      {intl.formatMessage({ id: copyDone ? 'codeCopied' : 'codeCopy' })}
    </SnippetAction>
  );
};
