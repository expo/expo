// Side-effect: installs the iOS UI worklet runtime and SharedObject
// support in the worklet runtime. Routed through this barrel so the
// installation happens exactly once per the bundler's module cache,
// regardless of which entry consumers import from.
import './index.fx';

export { useNativeState, type ObservableState } from './useNativeState';
export { useWorkletProp } from './useWorkletProp';
export { useWorkletCallback, type WorkletCallback } from './useWorkletCallback';
export { worklets } from './optionalWorklets';
export { getStateId } from './utils';
