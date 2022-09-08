import React, { PropsWithChildren, useEffect } from 'react';

import { Collapsible } from '~/ui/components/Collapsible';

type Props = PropsWithChildren<object> & { title?: string; abstract?: boolean };

export const ConfigReactNative = ({ children, abstract, title }: Props) => {
  if (!abstract) {
    title ??= 'Are you using this library in a bare React Native app?';
  } else {
    title ??= 'Working in a bare React Native app?';
  }

  useEffect(() => {
    if (typeof children === 'string') {
      throw new Error(
        `Content inside 'ConfigReactNative' needs to be surrounded by new lines to be parsed as markdown.\n\nMake sure there is a blank new line before and after this content: '${children}'`
      );
    }
  }, [children]);

  return <Collapsible summary={title}>{children}</Collapsible>;
};
