import { type PropsWithChildren } from 'react';

import { P } from '~/ui/components/Text';

export function HeaderDescription({ children }: PropsWithChildren) {
  return (
    <P theme="secondary" className="mb-3 mt-0">
      {children}
    </P>
  );
}
