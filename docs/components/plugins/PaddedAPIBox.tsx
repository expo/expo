import { PropsWithChildren } from 'react';

import { APIBox } from '~/components/plugins/APIBox';

type PaddedAPIBoxProps = PropsWithChildren<unknown>;

export function PaddedAPIBox({ children, ...props }: PaddedAPIBoxProps) {
  return (
    <APIBox className="px-4 py-3" {...props}>
      {children}
    </APIBox>
  );
}
