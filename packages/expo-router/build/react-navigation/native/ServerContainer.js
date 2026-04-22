'use client';
import * as React from 'react';
import { CurrentRenderContext } from '../core';
import { ServerContext } from './ServerContext';
/**
 * Container component for server rendering.
 *
 * @param props.location Location object to base the initial URL for SSR.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which contains helper methods.
 */
export function ServerContainer({ ref, children, location, }) {
    React.useEffect(() => {
        console.error("'ServerContainer' should only be used on the server with 'react-dom/server' for SSR.");
    }, []);
    const current = {};
    if (ref) {
        const value = {
            getCurrentOptions() {
                return current.options;
            },
        };
        // We write to the `ref` during render instead of `React.useImperativeHandle`
        // This is because `useImperativeHandle` will update the ref after 'commit',
        // and there's no 'commit' phase during SSR.
        // Mutating ref during render is unsafe in concurrent mode, but we don't care about it for SSR.
        if (typeof ref === 'function') {
            ref(value);
        }
        else {
            ref.current = value;
        }
    }
    return (<ServerContext.Provider value={{ location }}>
      <CurrentRenderContext.Provider value={current}>{children}</CurrentRenderContext.Provider>
    </ServerContext.Provider>);
}
//# sourceMappingURL=ServerContainer.js.map