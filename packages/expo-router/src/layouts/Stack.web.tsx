import { ComponentProps } from 'react';

import { RouterModal } from './ModalStack';
import { stackRouterOverride } from './StackClient';
import { Protected } from '../views/Protected';

// The RouterModal already includes Screen and Protected via withLayoutContext
// but we need to ensure we forward the stackRouterOverride for singular routes etc.

const Stack = Object.assign(
  (props: ComponentProps<typeof RouterModal>) => {
    return <RouterModal {...props} UNSTABLE_router={stackRouterOverride} />;
  },
  {
    Screen: RouterModal.Screen,
    Protected,
  }
);

export { Stack };

export default Stack;
