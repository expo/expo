/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2021 Callstack, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on https://github.com/callstack/repack/blob/3c1e0597557d09ab64fab0a29a86d3c487a23ef0/packages/repack/src/server/Symbolicator.ts
 */
/// <reference types="expo__bunyan" />
import Log from '@expo/bunyan';
import { SourceMapConsumer } from 'source-map';
/**
 * Raw React Native stack frame.
 */
export interface ReactNativeStackFrame {
    lineNumber: number | null;
    column: number | null;
    file: string | null;
    methodName: string;
}
/**
 * React Native stack frame used as input when processing by {@link Symbolicator}.
 */
export interface InputStackFrame extends ReactNativeStackFrame {
    file: string;
}
/**
 * Final symbolicated stack frame.
 */
export interface StackFrame extends InputStackFrame {
    collapse: boolean;
}
/**
 * Represents [@babel/core-frame](https://babeljs.io/docs/en/babel-code-frame).
 */
export interface CodeFrame {
    content: string;
    location: {
        row: number;
        column: number;
    };
    fileName: string;
}
/**
 * Represents results of running {@link process} method on {@link Symbolicator} instance.
 */
export interface SymbolicatorResults {
    codeFrame: CodeFrame | null;
    stack: StackFrame[];
}
/**
 * Class for transforming stack traces from React Native application with using Source Map.
 * Raw stack frames produced by React Native, points to some location from the bundle
 * eg `index.bundle?platform=ios:567:1234`. By using Source Map for that bundle `Symbolicator`
 * produces frames that point to source code inside your project eg `Hello.tsx:10:9`.
 */
export declare class Symbolicator {
    config: {
        projectRoot: string;
        logger: Log;
        customizeFrame: (frame: StackFrame) => StackFrame;
        getFileAsync: (props: {
            url: string;
            platform: string;
        }) => Promise<string>;
        getSourceMapAsync: (props: {
            url: string;
            platform: string;
        }) => Promise<string>;
    };
    /**
     * Infer platform from stack frames.
     * Usually at least one frame has `file` field with the bundle URL eg:
     * `http://localhost:8081/index.bundle?platform=ios&...`, which can be used to infer platform.
     *
     * @param stack Array of stack frames.
     * @returns Inferred platform or `undefined` if cannot infer.
     */
    static inferPlatformFromStack(stack: ReactNativeStackFrame[]): string | null;
    /**
     * Cache with initialized `SourceMapConsumer` to improve symbolication performance.
     */
    sourceMapConsumerCache: Record<string, SourceMapConsumer>;
    constructor(config: {
        projectRoot: string;
        logger: Log;
        customizeFrame: (frame: StackFrame) => StackFrame;
        getFileAsync: (props: {
            url: string;
            platform: string;
        }) => Promise<string>;
        getSourceMapAsync: (props: {
            url: string;
            platform: string;
        }) => Promise<string>;
    });
    /**
     * Process raw React Native stack frames and transform them using Source Maps.
     * Method will try to symbolicate as much data as possible, but if the Source Maps
     * are not available, invalid or the original positions/data is not found in Source Maps,
     * the method will return raw values - the same as supplied with `stack` parameter.
     * For example out of 10 frames, it's possible that only first 7 will be symbolicated and the
     * remaining 3 will be unchanged.
     *
     * @param stack Raw stack frames.
     * @returns Symbolicated stack frames.
     */
    process(stack: ReactNativeStackFrame[], { platform }: {
        platform: string;
    }): Promise<SymbolicatorResults>;
    private processFrame;
    private getCodeFrame;
}
