import { PropsWithChildren, useEffect } from 'react';

import { Collapsible } from '~/ui/components/Collapsible';
import { CODE } from '~/ui/components/Text';

type Props = PropsWithChildren<object>;

export const ConfigClassic = ({ children }: Props) => {
  useEffect(() => {
    if (typeof children === 'string') {
      throw new Error(
        `Content inside 'ConfigClassic' needs to be surrounded by new lines to be parsed as markdown.\n\n` +
          `Make sure there is a blank new line before and after this content: '${children}'`
      );
    }
  }, [children]);

  return (
    <Collapsible
      summary={
        <span>
          Are you using the classic build system? (<CODE>expo build:[android|ios]</CODE>)
        </span>
      }>
      {children}
    </Collapsible>
  );
};
