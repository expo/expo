import type { DOMProps } from './dom.types';
export interface DOMPropsInternal extends DOMProps {
    /**
     * Allows dynamically redirecting a component to a different source, for example prebuilt version.
     * @internal
     */
    sourceOverride?: {
        uri: string;
    };
}
//# sourceMappingURL=dom-internal.types.d.ts.map