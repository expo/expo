export type ParsedBuildError = {
    content: string;
    fileName: string;
    row: number;
    column: number;
    codeFrame: string;
    missingModule?: string;
};
export declare function parseMetroError(message: string): ParsedBuildError | null;
export declare function parseBabelTransformError(message: string): ParsedBuildError | null;
export declare function parseBabelCodeFrameError(message: string): ParsedBuildError | null;
