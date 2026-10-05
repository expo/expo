export interface Diagnostic {
    message: string;
    loc?: {
        line: number;
        column: number;
    };
}
export declare function formatDiagnostic(code: string, diagnostic: Diagnostic | undefined): (SyntaxError & {
    codeFrame: string;
}) | null;
export declare function annotateError(code: string | null, filename: string, error: Error): (Error & {
    codeFrame: string;
}) | null;
