/** Set `value` on `obj[key]` while bypassing readonly property annotations */
export declare function setOnReadonly<T, K extends keyof T, V extends T[K]>(obj: T, key: K, value: V): asserts obj is T & {
    [key in K]: V;
};
