import type { RequireContext } from '../types';
export interface RequireContextPonyFill extends RequireContext {
    __add(file: string): void;
    __delete(file: string): void;
}
export default function requireContext(base?: string, scanSubDirectories?: boolean, regularExpression?: RegExp, files?: Record<string, unknown>): RequireContextPonyFill;
//# sourceMappingURL=require-context-ponyfill.d.ts.map