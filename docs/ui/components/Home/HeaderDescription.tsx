import { type PropsWithChildren } from 'react';

import { P } from '~/ui/components/Text';

export function HeaderDescription({ children }: PropsWithChildren) {
  return (
    <P theme="secondary" className="mt-0 mb-3">
      {children}
    </P>
  );
}
