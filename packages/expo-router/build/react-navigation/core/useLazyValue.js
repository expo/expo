'use client';
import * as React from 'react';
export function useLazyValue(create) {
    const lazyRef = React.useRef(undefined);
    if (lazyRef.current === undefined) {
        lazyRef.current = create();
    }
    return lazyRef.current;
}
//# sourceMappingURL=useLazyValue.js.map