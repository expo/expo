import type { Diagnostic } from 'typescript';
export declare function formatDiagnostic(diagnostic: Diagnostic | undefined): (SyntaxError & {
    codeFrame: string;
}) | null;
export declare function annotateError(code: string | null, filename: string, error: Error): (Error & {
    codeFrame: string;
}) | null;
