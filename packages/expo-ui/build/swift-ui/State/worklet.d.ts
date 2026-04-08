/**
 * Creates a `WorkletCallback` SharedObject that wraps a worklet function.
 * The SharedObject's integer ID survives React's prop serialization,
 * allowing worklet callbacks to be passed as native view props.
 *
 * @internal — used by component wrappers to implement worklet callback props.
 */
export declare function useWorkletProp(callback?: (...args: any[]) => void): any;
//# sourceMappingURL=worklet.d.ts.map