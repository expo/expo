import { ComponentProps } from 'react';

import { stackRouterOverride } from './StackClient';
import { RouterModal, RouterModalScreen } from '../modal/web/ModalStack';
import { Protected } from '../views/Protected';

// The RouterModal already includes Screen and Protected via withLayoutContext
// but we need to ensure we forward the stackRouterOverride for singular routes etc.

const Stack = Object.assign(
  (props: ComponentProps<typeof RouterModal>) => {
    return <RouterModal {...props} UNSTABLE_router={stackRouterOverride} />;
  },
  {
    Screen: RouterModalScreen,
    Protected,
  }
);

export { Stack };

export default Stack;
