import React, { PropsWithChildren, useEffect } from 'react';

import { InlineCode } from '~/components/base/code';
import { B } from '~/components/base/paragraph';

type Props = PropsWithChildren<object>;

export const ConfigClassic = ({ children }: Props) => {
  useEffect(() => {
    if (typeof children === 'string') {
      throw new Error(
        `Content inside 'ConfigClassic' needs to be surrounded by new lines to be parsed as markdown.\n\nMake sure there is a blank new line before and after this content: '${children}'`
      );
    }
  }, [children]);

  return (
    <details>
      <summary>
        <B>Are you using the classic build system?</B> (
        <InlineCode>expo build:[android|ios]</InlineCode>)
      </summary>
      {children}
    </details>
  );
};
