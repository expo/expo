import React from 'react';
import { withClassName } from './className';
export function createClassNameView(View) {
    return React.forwardRef(({ style, className, ...props }, forwardedRef) => {
        return React.createElement(View, { ref: forwardedRef, style: withClassName(style, className), ...props });
    });
}
//# sourceMappingURL=createClassNameView.web.js.map