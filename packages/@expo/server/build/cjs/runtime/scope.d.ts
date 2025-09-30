import { RequestAPI } from './api';
export interface ScopeDefinition<Scope extends RequestAPI = any> {
    getStore(): Scope | undefined;
    run<R>(scope: Scope, runner: () => R): R;
    run<R, TArgs extends any[]>(scope: Scope, runner: (...args: TArgs) => R, ...args: TArgs): R;
}
declare const scopeRef: {
    current: ScopeDefinition<RequestAPI> | null;
};
export { scopeRef };
