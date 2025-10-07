import type { ComponentProps } from 'react';

import { stackRouterOverride } from './StackClient';
import { RouterModal } from '../modal/web/ModalStack';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';

// The RouterModal already includes Screen and Protected via withLayoutContext
// but we need to ensure we forward the stackRouterOverride for singular routes etc.
export default Object.assign(
  (props: ComponentProps<typeof RouterModal>) => {
    return <RouterModal {...props} UNSTABLE_router={stackRouterOverride} />;
  },
  {
    Screen,
    Protected,
  }
);
