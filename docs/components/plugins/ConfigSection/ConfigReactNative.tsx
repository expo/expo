import React, { PropsWithChildren, useEffect } from 'react';

import { B } from '~/components/base/paragraph';

type Props = PropsWithChildren<object>;

export const ConfigReactNative = ({ children }: Props) => {
  useEffect(() => {
    if (typeof children === 'string') {
      throw new Error(
        `Content inside 'ConfigReactNative' needs to be surrounded by new lines to be parsed as markdown.\n\nMake sure there is a blank new line before and after this content: '${children}'`
      );
    }
  }, [children]);

  return (
    <details>
      <summary>
        <B>Are you using this library in a bare React Native app?</B>
      </summary>
      {children}
    </details>
  );
};
