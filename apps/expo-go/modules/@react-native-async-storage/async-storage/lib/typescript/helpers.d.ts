import type { ErrorLike } from "./types";
export declare function checkValidArgs(keyValuePairs: readonly unknown[], callback: unknown): void;
export declare function checkValidInput(...input: unknown[]): void;
export declare function convertError(error?: ErrorLike): Error | null;
export declare function convertErrors(errs?: ErrorLike[]): ReadonlyArray<Error | null> | null;
//# sourceMappingURL=helpers.d.ts.map