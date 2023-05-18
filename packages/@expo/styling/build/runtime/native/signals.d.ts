import { Signal } from "../../types";
/**
 * Signals make values reactive, as going through function calls to get/set values for them enables the automatic
 * dependency tracking and computation re-execution
 *
 * @typedef T - the value of the signal
 * @returns {Signal<T>} - the signal
 */
export declare function createSignal<T = unknown>(value: T): Signal<T>;
/**
 * Runs a computation function and returns its result.
 * This function also takes an array of dependencies, and will re-run the computation if any of these dependencies have changed.
 * It also takes a callback to rerender the component if the computation result changes.
 *
 * @typeParam T - the return type of the computation function
 * @param {() => T} fn - the computation function to be run
 * @param {unknown[]} dependencies - an array of dependencies that may change the computation result
 * @param {() => void} rerender - a callback to rerender the component if the computation result changes
 * @returns {T} - the result of the computation function
 */
export declare function useComputation<T>(fn: () => T, dependencies: unknown[], rerender: () => void): T;
//# sourceMappingURL=signals.d.ts.map