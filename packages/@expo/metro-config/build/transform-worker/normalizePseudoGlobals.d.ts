import type { File } from '@babel/types';
export interface Options {
    readonly reservedNames?: ReadonlyArray<string>;
}
export default function normalizePseudoGlobals(ast: File, options?: Options): string[];
