/// <reference types="expo__bunyan" />
/// <reference types="node" />
import type Log from '@expo/bunyan';
import { ExpoConfig } from '@expo/config';
import type { LoadOptions } from '@expo/metro-config';
import type { Server as ConnectServer } from 'connect';
import http from 'http';
import type Metro from 'metro';
import LogReporter from './LogReporter';
import { createDevServerMiddleware } from './middleware/devServerMiddleware';
export type MetroDevServerOptions = LoadOptions & {
    logger: Log;
    quiet?: boolean;
    unversioned?: boolean;
};
export type BundleOptions = {
    entryPoint: string;
    platform: 'android' | 'ios' | 'web';
    dev?: boolean;
    minify?: boolean;
    sourceMapUrl?: string;
};
export type BundleAssetWithFileHashes = Metro.AssetData & {
    fileHashes: string[];
};
export type BundleOutput = {
    code: string;
    map: string;
    hermesBytecodeBundle?: Uint8Array;
    hermesSourcemap?: string;
    assets: readonly BundleAssetWithFileHashes[];
};
export type MessageSocket = {
    broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};
export declare function runMetroDevServerAsync(projectRoot: string, options: MetroDevServerOptions): Promise<{
    server: http.Server;
    middleware: any;
    messageSocket: MessageSocket;
}>;
export declare function bundleAsync(projectRoot: string, expoConfig: ExpoConfig, options: MetroDevServerOptions, bundles: BundleOptions[]): Promise<BundleOutput[]>;
/**
 * Attach the inspector proxy to a development server.
 * Inspector proxy is used for viewing the JS context in a browser.
 * This must be attached after the server is listening.
 * Attaching consists of pushing custom middleware and appending WebSockets to the server.
 *
 *
 * @param projectRoot
 * @param props.server dev server to add WebSockets to
 * @param props.middleware dev server middleware to add extra middleware to
 */
export declare function attachInspectorProxy(projectRoot: string, { server, middleware }: {
    server: http.Server;
    middleware: ConnectServer;
}): {
    inspectorProxy: any;
};
export { LogReporter, createDevServerMiddleware };
export * from './middlwareMutations';
export * from './JsInspector';
