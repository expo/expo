/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import * as path from 'path';

import isVcsPath from '../lib/isVcsPath';
import type { WatcherBackend, WatcherBackendChangeEvent, WatcherBackendOptions } from '../types';
import { posixPathMatchesPattern } from './common';

// Distributive Omit that works correctly with union types
type EachOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type WatcherBackendChangeEventWithoutRoot = EachOmit<WatcherBackendChangeEvent, 'root'>;

export interface Listeners {
  onFileEvent(event: WatcherBackendChangeEvent): void;
  onError(error: Error): void;
}

export class AbstractWatcher implements WatcherBackend {
  readonly root: string;
  readonly ignored: RegExp | undefined | null;
  readonly globs: readonly string[];
  readonly dot: boolean;
  readonly doIgnore: (path: string) => boolean;

  #emitter: EventEmitter = new EventEmitter();

  constructor(dir: string, opts: WatcherBackendOptions) {
    const { ignored, globs, dot } = opts;
    this.dot = dot || false;
    this.ignored = ignored;
    this.globs = globs;
    this.doIgnore = ignored
      ? (filePath: string) => isVcsPath(filePath) || posixPathMatchesPattern(ignored, filePath)
      : isVcsPath;

    this.root = path.resolve(dir);
  }

  onFileEvent(listener: (event: WatcherBackendChangeEvent) => void): () => void {
    this.#emitter.on('fileevent', listener);
    return () => {
      this.#emitter.removeListener('fileevent', listener);
    };
  }

  onError(listener: (error: Error) => void): () => void {
    this.#emitter.on('error', listener);
    return () => {
      this.#emitter.removeListener('error', listener);
    };
  }

  async startWatching(): Promise<void> {
    // Must be implemented by subclasses
  }

  async stopWatching(): Promise<void> {
    this.#emitter.removeAllListeners();
  }

  emitFileEvent(event: WatcherBackendChangeEventWithoutRoot) {
    this.#emitter.emit('fileevent', {
      ...event,
      root: this.root,
    });
  }

  emitError(error: Error) {
    this.#emitter.emit('error', error);
  }

  getPauseReason(): string | undefined | null {
    return null;
  }
}
