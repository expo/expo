/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'node:events';
import * as path from 'node:path';

import isWatcherExcluded from '../lib/isWatcherExcluded';
import type {
  WatcherBackend,
  WatcherBackendChangeEvent,
  WatcherBackendOptions,
  WatcherIncludedFiles,
} from '../types';
import { posixPathMatchesPattern } from './common';

// Distributive Omit, so that each member of a union keeps its own fields.
type EachOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type WatcherBackendChangeEventWithoutRoot = EachOmit<WatcherBackendChangeEvent, 'root'>;

export type Listeners = Readonly<{
  onFileEvent: (event: WatcherBackendChangeEvent) => void;
  onError: (error: Error) => void;
}>;

export class AbstractWatcher implements WatcherBackend {
  readonly root: string;
  readonly ignored: RegExp | null | undefined;
  readonly included: WatcherIncludedFiles | null | undefined;
  readonly doIgnore: (path: string) => boolean;

  #emitter: EventEmitter = new EventEmitter();

  /**
   * Whether a watch reports every change made after `startWatching` resolves.
   * If not, `Watcher` confirms each watch with a change of its own before
   * relying on it.
   */
  static isLiveOnStart(): boolean {
    return true;
  }

  constructor(dir: string, opts: WatcherBackendOptions) {
    const { ignored, included } = opts;
    this.ignored = ignored;
    this.included = included;
    this.doIgnore = ignored
      ? (filePath: string) =>
          isWatcherExcluded(filePath) || posixPathMatchesPattern(ignored, filePath)
      : isWatcherExcluded;

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

  getPauseReason(): string | null | undefined {
    return null;
  }
}
