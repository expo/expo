'use client';
import { useMemo, type ComponentProps } from 'react';

import { RouterModal } from '../modal/web/ModalStack';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
import { stackRouterOverride } from './StackClient';
import { mapProtectedScreen } from './stack-utils';

export default Object.assign(
  ({ children, ...props }: ComponentProps<typeof RouterModal>) => {
    const rnChildren = useMemo(
      () => mapProtectedScreen({ guard: true, children }).children,
      [children]
    );
    return <RouterModal {...props} UNSTABLE_router={stackRouterOverride} children={rnChildren} />;
  },
  {
    Screen,
    Protected,
  }
);
