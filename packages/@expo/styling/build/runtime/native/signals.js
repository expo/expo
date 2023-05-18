"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useComputation = exports.createSignal = void 0;
const react_1 = require("react");
const context = [];
/**
 * Signals make values reactive, as going through function calls to get/set values for them enables the automatic
 * dependency tracking and computation re-execution
 *
 * @typedef T - the value of the signal
 * @returns {Signal<T>} - the signal
 */
function createSignal(value) {
    const subscriptions = new Set();
    const get = () => {
        const running = context[context.length - 1];
        if (running) {
            subscriptions.add(running);
            running.dependencies.add(subscriptions);
        }
        return value;
    };
    const snapshot = () => value;
    const set = (nextValue) => {
        if (Object.is(value, nextValue))
            return;
        value = nextValue;
        stale(1, true);
        stale(-1, true);
    };
    const stale = (change, fresh) => {
        for (const subscriber of [...subscriptions]) {
            if (typeof subscriber === "function") {
                subscriber();
            }
            else {
                subscriber.stale(change, fresh);
            }
        }
    };
    const subscribe = (callback) => {
        subscriptions.add(callback);
        return () => {
            subscriptions.delete(callback);
        };
    };
    return { get, set, stale, subscribe, snapshot };
}
exports.createSignal = createSignal;
function cleanup(running) {
    for (const dep of running.dependencies) {
        dep.delete(running);
    }
    running.dependencies.clear();
}
function createComputation(fn) {
    const computation = {
        fn,
        waiting: 0,
        fresh: false,
        signal: createSignal(undefined),
        dependencies: new Set(),
        snapshot() {
            return computation.signal.snapshot();
        },
        subscribe(callback) {
            return this.signal.subscribe(callback);
        },
        execute() {
            cleanup(computation);
            context.push(computation);
            this.waiting = 0;
            this.fresh = false;
            this.signal.set(this.fn());
            context.pop();
        },
        update(fn) {
            if (fn === this.fn)
                return;
            this.fn = fn;
            this.execute();
        },
        stale(change, fresh) {
            if (!this.waiting && change < 0)
                return;
            if (!this.waiting && change > 0) {
                this.signal.stale(1, false);
            }
            this.waiting += change;
            this.fresh || (this.fresh = fresh);
            if (!this.waiting) {
                this.waiting = 0;
                if (this.fresh) {
                    this.execute();
                }
                this.signal.stale(-1, false);
            }
        },
    };
    computation.execute();
    return computation;
}
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
function useComputation(fn, dependencies, rerender) {
    const [computation] = (0, react_1.useState)(() => createComputation(fn));
    (0, react_1.useMemo)(() => computation.update(fn), dependencies);
    (0, react_1.useEffect)(() => computation.subscribe(rerender), [computation]);
    return computation.snapshot();
}
exports.useComputation = useComputation;
//# sourceMappingURL=signals.js.map