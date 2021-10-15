import React, { PropsWithChildren } from 'react';

import { InlineCode } from '~/components/base/code';
import { B } from '~/components/base/paragraph';

type Props = PropsWithChildren<object>;

export const ConfigClassic = ({ children }: Props) => (
  <details>
    <summary>
      <B>Are you using the classic build system?</B> (
      <InlineCode>expo build:[android|ios]</InlineCode>)
    </summary>
    {children}
  </details>
);
