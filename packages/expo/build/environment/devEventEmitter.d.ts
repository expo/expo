type DevLoadingEvents = {
    'devLoadingView:showMessage'(payload: {
        message: string;
    }): any;
    'devLoadingView:hide'(): any;
};
/** The event emitter used for the dev loading view events */
export declare const emitter: import("expo-modules-core/src/ts-declarations/EventEmitter").EventEmitter<DevLoadingEvents>;
export {};
//# sourceMappingURL=devEventEmitter.d.ts.map