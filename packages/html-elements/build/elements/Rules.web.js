import { forwardRef } from 'react';
import { createElement } from 'react-native';
export const BR = forwardRef((props, ref) => createElement('br', { ...props, ref }));
export const HR = forwardRef((props, ref) => {
    return createElement('hr', { ...props, ref });
});
//# sourceMappingURL=Rules.web.js.map