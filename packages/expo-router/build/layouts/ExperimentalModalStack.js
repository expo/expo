'use client';
import { useMemo } from 'react';
import { stackRouterOverride } from './StackClient';
import { mapProtectedScreen } from './stack-utils';
import { RouterModal } from '../modal/web/ModalStack';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
export default Object.assign(({ children, ...props }) => {
    const rnChildren = useMemo(() => mapProtectedScreen({ guard: true, children }).children, [children]);
    return <RouterModal {...props} UNSTABLE_router={stackRouterOverride} children={rnChildren}/>;
}, {
    Screen,
    Protected,
});
//# sourceMappingURL=ExperimentalModalStack.js.map