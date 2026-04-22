'use client';
import { useId } from 'react';
import { RouterToolbarItem } from '../../../../toolbar/native';
/**
 * Native toolbar spacer component for bottom toolbar.
 * Renders as RouterToolbarItem with type 'fixedSpacer' or 'fluidSpacer'.
 */
export const NativeToolbarSpacer = (props) => {
    const id = useId();
    return (<RouterToolbarItem hidesSharedBackground={props.hidesSharedBackground} hidden={props.hidden} identifier={id} sharesBackground={props.sharesBackground} type={props.width ? 'fixedSpacer' : 'fluidSpacer'} width={props.width}/>);
};
//# sourceMappingURL=native.ios.js.map