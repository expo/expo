import React, { PropsWithChildren, useEffect } from 'react';

import { Collapsible } from '~/ui/components/Collapsible';

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
    <Collapsible summary="Are you using this library in a bare React Native app?">
      {children}
    </Collapsible>
  );
};
