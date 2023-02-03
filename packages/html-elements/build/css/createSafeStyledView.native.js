import React, { useMemo } from 'react';
import { filterStyles } from './filterStyles';
export function createSafeStyledView(View) {
    return React.forwardRef(({ style, ...props }, forwardedRef) => {
        // Filter and apply `center` prop.
        const finalStyle = useMemo(() => filterStyles(style), [style]);
        return React.createElement(View, { ref: forwardedRef, style: finalStyle, ...props });
    });
}
//# sourceMappingURL=createSafeStyledView.native.js.map