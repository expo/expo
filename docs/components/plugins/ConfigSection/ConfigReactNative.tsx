import React, { PropsWithChildren } from 'react';

import { B } from '~/components/base/paragraph';

type Props = PropsWithChildren<object>;

export const ConfigReactNative = ({ children }: Props) => (
  <details>
    <summary>
      <B>Are you using this library in a bare React Native app?</B>
    </summary>
    {children}
  </details>
);
