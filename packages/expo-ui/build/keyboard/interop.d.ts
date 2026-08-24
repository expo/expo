/**
 * How a `<Host>` acts on the field that holds focus, once React Native asks the
 * host to blur or focus.
 */
export type HostedFocusController = {
    blurFocusedFields: () => void;
    /** Refocuses the field that held focus last, if it is still there. */
    focusLastField: () => void;
};
/**
 * Starts routing React Native's blur and focus requests for this host to its
 * hosted fields.
 */
export declare function attachHostController(instance: object, controller: HostedFocusController): void;
export declare function detachHostController(instance: object): void;
//# sourceMappingURL=interop.d.ts.map