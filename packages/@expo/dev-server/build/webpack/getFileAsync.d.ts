/// <reference types="node" />
import type { IncomingMessage } from 'http';
import webpack from 'webpack';
export declare type AnyCompiler = webpack.Compiler | webpack.MultiCompiler;
/**
 * Read a file from the webpack "compiler".
 *
 * @param compiler webpack compiler
 * @param filename Like: `/Users/evanbacon/Documents/GitHub/lab/yolo47/web-build/index.bundle`
 * @returns
 */
export declare function getFileFromCompilerAsync(compiler: AnyCompiler, { fileName, platform }: {
    fileName: string;
    platform?: string;
}): Promise<string>;
export declare function getPlatformFromRequest(request: IncomingMessage): string | null;
/**
 * Get the Webpack compiler for a given platform.
 * In Expo we distinguish platforms by using the `name` property of the Webpack config.
 *
 * When the platform is undefined, or the compiler cannot be identified, we assert.
 *
 * @param compiler
 * @param platform
 * @returns
 */
export declare function getCompilerForPlatform(compiler: AnyCompiler, platform?: string): webpack.Compiler;
export declare function createGetFileNameFromUrl(compiler: AnyCompiler, publicPath?: string): ({ url, platform }: {
    url: string;
    platform?: string | undefined;
}) => string;
