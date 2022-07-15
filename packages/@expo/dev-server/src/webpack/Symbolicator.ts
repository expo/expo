/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2021 Callstack, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on https://github.com/callstack/repack/blob/3c1e0597557d09ab64fab0a29a86d3c487a23ef0/packages/repack/src/server/Symbolicator.ts
 */

import { codeFrameColumns } from '@babel/code-frame';
import Log from '@expo/bunyan';
import fs from 'fs';
import { SourceMapConsumer } from 'source-map';
import { URL } from 'url';

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
export class Symbolicator {
  /**
   * Infer platform from stack frames.
   * Usually at least one frame has `file` field with the bundle URL eg:
   * `http://localhost:8081/index.bundle?platform=ios&...`, which can be used to infer platform.
   *
   * @param stack Array of stack frames.
   * @returns Inferred platform or `undefined` if cannot infer.
   */
  static inferPlatformFromStack(stack: ReactNativeStackFrame[]) {
    for (const frame of stack) {
      if (!frame.file) {
        return null;
      }

      const { searchParams, pathname } = new URL(frame.file, 'file://');
      const platform = searchParams.get('platform');
      if (platform) {
        return platform;
      } else {
        const [bundleFilename] = pathname.split('/').reverse();
        const [, platformOrExtension, extension] = bundleFilename.split('.');
        if (extension) {
          return platformOrExtension;
        }
      }
    }
    return null;
  }

  /**
   * Cache with initialized `SourceMapConsumer` to improve symbolication performance.
   */
  sourceMapConsumerCache: Record<string, SourceMapConsumer> = {};

  constructor(
    public config: {
      projectRoot: string;
      logger: Log;
      customizeFrame: (frame: StackFrame) => StackFrame;
      getFileAsync: (props: { url: string; platform: string }) => Promise<string>;
      getSourceMapAsync: (props: { url: string; platform: string }) => Promise<string>;
    }
  ) {}

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
  async process(
    stack: ReactNativeStackFrame[],
    { platform }: { platform: string }
  ): Promise<SymbolicatorResults> {
    // TODO: add debug logging
    const frames: InputStackFrame[] = [];
    for (const frame of stack) {
      const { file } = frame;

      if (file?.startsWith('http') && !file.includes('debuggerWorker')) {
        frames.push(frame as InputStackFrame);
      }
    }

    try {
      const processedFrames: StackFrame[] = [];
      for (const frame of frames) {
        if (!this.sourceMapConsumerCache[frame.file]) {
          const rawSourceMap = await this.config.getSourceMapAsync({
            url: frame.file,
            platform,
          });
          const sourceMapConsumer = await new SourceMapConsumer(rawSourceMap as any);
          this.sourceMapConsumerCache[frame.file] = sourceMapConsumer;
        }
        const processedFrame = this.config.customizeFrame(this.processFrame(frame));

        processedFrames.push(processedFrame);
      }

      const codeFrame = await this.getCodeFrame(processedFrames, platform);
      return {
        stack: processedFrames,
        codeFrame: codeFrame ?? null,
      };
    } finally {
      for (const key in this.sourceMapConsumerCache) {
        delete this.sourceMapConsumerCache[key];
      }
    }
  }

  private processFrame(frame: InputStackFrame): StackFrame {
    if (!frame.lineNumber || !frame.column) {
      return {
        ...frame,
        collapse: false,
      };
    }

    const consumer = this.sourceMapConsumerCache[frame.file];
    if (!consumer) {
      return {
        ...frame,
        collapse: false,
      };
    }

    const lookup = consumer.originalPositionFor({
      line: frame.lineNumber,
      column: frame.column,
    });

    // If lookup fails, we get the same shape object, but with
    // all values set to null
    if (!lookup.source) {
      // It is better to gracefully return the original frame
      // than to throw an exception
      return {
        ...frame,
        collapse: false,
      };
    }

    return {
      lineNumber: lookup.line || frame.lineNumber,
      column: lookup.column || frame.column,
      file: lookup.source,
      methodName: lookup.name || frame.methodName,
      collapse: false,
    };
  }

  private async getCodeFrame(
    processedFrames: StackFrame[],
    platform: string
  ): Promise<CodeFrame | undefined> {
    for (const frame of processedFrames) {
      if (frame.collapse || !frame.lineNumber || !frame.column) {
        continue;
      }

      try {
        let filename;
        let source;

        if (frame.file.startsWith('http') && frame.file.includes('index.bundle')) {
          // Frame points to the bundle so we need to read bundle from WDM's FS.
          filename = frame.file;
          source = await this.config.getFileAsync({ url: '/index.bundle', platform });
        } else {
          filename = frame.file.replace('webpack://', '');
          source = await fs.promises.readFile(filename, 'utf8');
        }

        return {
          content: codeFrameColumns(
            source,
            {
              start: { column: frame.column, line: frame.lineNumber },
            },
            { forceColor: true }
          ),
          location: {
            row: frame.lineNumber,
            column: frame.column,
          },
          fileName: filename,
        };
      } catch (error: any) {
        this.config.logger.error(
          { tag: 'dev-server' },
          'Symbolication failed to create code preview: ' + error.message
        );
      }
    }
    return undefined;
  }
}
