import { LogBoxLogDataLegacy, MetroStackFrame } from '../Data/Types';
export declare function parseWebBuildErrors({ error, projectRoot, parseErrorStack, }: {
    error: Error & {
        type?: unknown;
    };
    projectRoot: string;
    parseErrorStack: (projectRoot: string, stack?: string) => (MetroStackFrame & {
        collapse?: boolean;
    })[];
}): LogBoxLogDataLegacy;
