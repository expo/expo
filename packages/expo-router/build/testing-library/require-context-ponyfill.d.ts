import type { RequireContext } from '../types';
interface RequireContextPonyFill extends RequireContext {
    __add(file: string): void;
    __delete(file: string): void;
}
export default function requireContext(base?: string, scanSubDirectories?: boolean, regularExpression?: RegExp): RequireContextPonyFill;
export {};
//# sourceMappingURL=require-context-ponyfill.d.ts.map