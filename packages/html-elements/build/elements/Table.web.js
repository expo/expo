import React, { forwardRef } from 'react';
import View from '../primitives/RNWView';
function createView(nativeProps) {
    return forwardRef((props, ref) => {
        return <View {...nativeProps} {...props} ref={ref}/>;
    });
}
export const Table = createView({ __element: 'table' });
export const THead = createView({ __element: 'thead' });
export const TBody = createView({ __element: 'tbody' });
export const TFoot = createView({ __element: 'tfoot' });
export const TH = createView({ __element: 'th' });
export const TR = createView({ __element: 'tr' });
export const TD = createView({ __element: 'td' });
export const Caption = createView({ __element: 'caption' });
if (__DEV__) {
    Table.displayName = 'Table';
    THead.displayName = 'THead';
    TBody.displayName = 'TBody';
    TFoot.displayName = 'TFoot';
    TH.displayName = 'TH';
    TR.displayName = 'TR';
    TD.displayName = 'TD';
    Caption.displayName = 'Caption';
}
//# sourceMappingURL=Table.web.js.map