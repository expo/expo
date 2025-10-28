import { LogBoxLogDataLegacy, MetroStackFrame } from '../Data/Types';
/**
 * Called in expo/cli, the return value is injected into the static error page which is bundled
 * instead of the app when the web build fails.
 */
export declare function parseWebBuildErrors({ error, projectRoot, parseErrorStack, }: {
    error: Error & {
        type?: unknown;
    };
    projectRoot: string;
    parseErrorStack: (projectRoot: string, stack?: string) => (MetroStackFrame & {
        collapse?: boolean;
    })[];
}): LogBoxLogDataLegacy;
