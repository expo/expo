import React, { PropsWithChildren, useEffect } from 'react';

import { InlineCode } from '~/components/base/code';
import { Collapsible } from '~/ui/components/Collapsible';

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
    <Collapsible
      summary={
        <span>
          Are you using the classic build system? (<InlineCode>expo build:[android|ios]</InlineCode>
          )
        </span>
      }>
      {children}
    </Collapsible>
  );
};
