import { ExpoWebGLRenderingContext } from './GLView.types';
export declare function createWorkletContextManager(): {
    getContext: (contextId: number) => ExpoWebGLRenderingContext | undefined;
    unregister?: (contextId: number) => void;
};
//# sourceMappingURL=GLWorkletContextManager.d.ts.map