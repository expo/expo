import React, { type PropsWithChildren } from 'react';
/**
 * Injects loader data into the HTML as a script tag for client-side hydration.
 * The data is serialized as JSON and made available on the `globalThis.__EXPO_ROUTER_LOADER_DATA__` global.
 */
export declare function PreloadedDataScript({ data }: {
    data: Record<string, unknown>;
}): React.JSX.Element;
export declare function Html({ children }: PropsWithChildren): React.JSX.Element;
//# sourceMappingURL=html.d.ts.map