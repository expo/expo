'use client';
import { useId } from 'react';
import { RouterToolbarItem } from '../../../../toolbar/native';
/**
 * Native toolbar view component for bottom toolbar.
 * Renders as RouterToolbarItem with children.
 */
export const NativeToolbarView = ({ children, hidden, hidesSharedBackground, separateBackground, }) => {
    const id = useId();
    return (<RouterToolbarItem hidesSharedBackground={hidesSharedBackground} hidden={hidden} identifier={id} sharesBackground={!separateBackground}>
      {children}
    </RouterToolbarItem>);
};
//# sourceMappingURL=native.ios.js.map