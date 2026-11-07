/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import debugModule from 'debug';
import type {
  Client,
  WatchmanClockResponse,
  WatchmanFileChange,
  WatchmanQuery,
  WatchmanSubscribeResponse,
  WatchmanSubscriptionEvent,
  WatchmanWatchResponse,
} from 'fb-watchman';
import watchman from 'fb-watchman';
import invariant from 'invariant';
import assert from 'node:assert';
import { createHash } from 'node:crypto';

import normalizePathSeparatorsToPosix from '../lib/normalizePathSeparatorsToPosix';
import normalizePathSeparatorsToSystem from '../lib/normalizePathSeparatorsToSystem';
import type { WatchmanClockSpec } from '../types';
import { AbstractWatcher } from './AbstractWatcher';
import RecrawlWarning from './RecrawlWarning';
import * as common from './common';
import type { WatcherOptions } from './common';

const debug = debugModule('Metro:WatchmanWatcher');

const DELETE_EVENT = common.DELETE_EVENT;
const TOUCH_EVENT = common.TOUCH_EVENT;
const SUB_PREFIX = 'metro-file-map';

/**
 * Watches `dir`.
 */
export default class WatchmanWatcher extends AbstractWatcher {
  // Assigned by `#init`, which `startWatching` calls before anything reads it.
  #client!: Client;
  readonly subscriptionName: string;
  #watchProjectInfo:
    | Readonly<{
        relativePath: string;
        root: string;
      }>
    | null
    | undefined;
  readonly #watchmanDeferStates: readonly string[];
  #deferringStates: Set<string> | null | undefined = null;
  // Clocks captured by the crawl, keyed by absolute (posix-separated) Watchman
  // watch root. Consumed by the initial subscription only - a re-subscribe
  // after disconnection starts from a fresh clock as before.
  #clocks: Map<string, WatchmanClockSpec> | null | undefined;

  constructor(dir: string, opts: WatcherOptions) {
    const { watchmanDeferStates, clocks, ...baseOpts } = opts;
    super(dir, baseOpts);

    this.#watchmanDeferStates = watchmanDeferStates;
    this.#clocks = clocks ?? null;

    // Use a unique subscription name per process per watched directory
    const watchKey = createHash('md5').update(this.root).digest('hex');
    const readablePath = this.root
      .replace(/[/\\]/g, '-') // \ and / to -
      .replace(/[^\-\w]/g, ''); // Remove non-word/hyphen
    this.subscriptionName = `${SUB_PREFIX}-${process.pid}-${readablePath}-${watchKey}`;
  }

  async startWatching(): Promise<void> {
    await new Promise<void>((resolve, reject) => this.#init(resolve, reject));
  }

  /**
   * Run the watchman `watch` command on the root and subscribe to changes.
   */
  #init(onReady: () => void, onError: (error: Error) => void) {
    if (this.#client) {
      this.#client.removeAllListeners();
    }

    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    this.#client = new watchman.Client();
    this.#client.on('error', (error) => {
      this.emitError(error);
    });
    this.#client.on('subscription', (changeEvent: WatchmanSubscriptionEvent) =>
      this.#handleChangeEvent(changeEvent)
    );
    this.#client.on('end', () => {
      console.warn('[metro-file-map] Warning: Lost connection to Watchman, reconnecting..');
      self.#init(
        () => {},
        (error) => self.emitError(error)
      );
    });

    this.#watchProjectInfo = null;

    function getWatchRoot() {
      return self.#watchProjectInfo ? self.#watchProjectInfo.root : self.root;
    }

    function onWatchProject(error: Error | null | undefined, resp: WatchmanWatchResponse) {
      if (error) {
        onError(error);
        return;
      }
      debug('Received watch-project response: %s', resp.relative_path);

      handleWarning(resp);

      // NB: Watchman outputs posix-separated paths even on Windows, convert
      // them to system-native separators.
      self.#watchProjectInfo = {
        relativePath: resp.relative_path ? normalizePathSeparatorsToSystem(resp.relative_path) : '',
        root: normalizePathSeparatorsToSystem(resp.watch),
      };

      // If the crawl gave us a clock for this watch root, subscribe `since`
      // it, so that changes made between the crawl and this subscription are
      // reported rather than missed. Otherwise request a fresh clock.
      const sinceClock = self.#clocks?.get(normalizePathSeparatorsToPosix(resp.watch));
      self.#clocks = null;
      if (sinceClock != null) {
        subscribe(sinceClock);
      } else {
        self.#client.command(['clock', getWatchRoot()], onClock);
      }
    }

    function onClock(error: Error | null | undefined, resp: WatchmanClockResponse) {
      if (error) {
        onError(error);
        return;
      }

      debug('Received clock response: %s', resp.clock);
      handleWarning(resp);
      subscribe(resp.clock);
    }

    function subscribe(since: WatchmanClockSpec) {
      const watchProjectInfo = self.#watchProjectInfo;

      invariant(
        watchProjectInfo != null,
        'watch-project response should have been set before subscribing'
      );

      const options: WatchmanQuery = {
        fields: ['name', 'exists', 'new', 'type', 'size', 'mtime_ms'],
        since,
        defer: self.#watchmanDeferStates,
        relative_root: watchProjectInfo.relativePath,
      };

      self.#client.command(
        ['subscribe', getWatchRoot(), self.subscriptionName, options],
        onSubscribe
      );
    }

    const onSubscribe = (error: Error | null | undefined, resp: WatchmanSubscribeResponse) => {
      if (error) {
        onError(error);
        return;
      }
      debug('Received subscribe response: %s', resp.subscribe);

      handleWarning(resp);

      if (resp['asserted-states'] != null) {
        this.#deferringStates = new Set(resp['asserted-states']);
      }

      onReady();
    };

    self.#client.command(['watch-project', getWatchRoot()], onWatchProject);
  }

  /**
   * Handles a change event coming from the subscription.
   */
  #handleChangeEvent(resp: WatchmanSubscriptionEvent) {
    debug(
      'Received subscription response: %s (fresh: %s, files: %s, enter: %s, leave: %s, clock: %s)',
      resp.subscription,
      resp.is_fresh_instance,
      resp.files?.length,
      resp['state-enter'],
      resp['state-leave'],
      resp.clock
    );

    assert.equal(resp.subscription, this.subscriptionName, 'Invalid subscription event.');

    if (Array.isArray(resp.files)) {
      resp.files.forEach((change) => this.#handleFileChange(change, resp.clock));
    }
    const { 'state-enter': stateEnter, 'state-leave': stateLeave } = resp;
    if (stateEnter != null && (this.#watchmanDeferStates ?? []).includes(stateEnter)) {
      this.#deferringStates?.add(stateEnter);
      debug('Watchman reports "%s" just started. Filesystem notifications are paused.', stateEnter);
    }
    if (stateLeave != null && (this.#watchmanDeferStates ?? []).includes(stateLeave)) {
      this.#deferringStates?.delete(stateLeave);
      debug('Watchman reports "%s" ended. Filesystem notifications resumed.', stateLeave);
    }
  }

  /**
   * Handles a single change event record.
   */
  #handleFileChange(
    changeDescriptor: WatchmanFileChange,
    rawClock: WatchmanSubscriptionEvent['clock']
  ) {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    const watchProjectInfo = self.#watchProjectInfo;

    invariant(
      watchProjectInfo != null,
      'watch-project response should have been set before receiving subscription events'
    );

    const {
      name: relativePosixPath,
      new: isNew = false,
      exists = false,
      type,
      mtime_ms,
      size,
    } = changeDescriptor;

    // Watchman emits posix-separated paths on Windows, which is inconsistent
    // with other watchers. Normalize to system-native separators.
    const relativePath = normalizePathSeparatorsToSystem(relativePosixPath);

    debug(
      'Handling change to: %s (new: %s, exists: %s, type: %s)',
      relativePath,
      isNew,
      exists,
      type
    );

    // Ignore files of an unrecognized type
    if (type != null && !(type === 'f' || type === 'd' || type === 'l')) {
      return;
    }

    if (this.doIgnore(relativePath) || !common.isIncluded(type, this.included, relativePath)) {
      return;
    }

    const clock =
      typeof rawClock === 'string' && this.#watchProjectInfo != null
        ? ([this.#watchProjectInfo.root, rawClock] as [string, string])
        : undefined;

    if (!exists) {
      self.emitFileEvent({ event: DELETE_EVENT, clock, relativePath });
    } else {
      invariant(
        type != null && mtime_ms != null && size != null,
        'Watchman file change event for "%s" missing some requested metadata. ' +
          'Got type: %s, mtime_ms: %s, size: %s',
        relativePath,
        type,
        mtime_ms,
        size
      );

      if (
        // Change event on dirs are mostly useless.
        !(type === 'd' && !isNew)
      ) {
        const mtime = Number(mtime_ms);
        self.emitFileEvent({
          event: TOUCH_EVENT,
          clock,
          relativePath,
          metadata: {
            modifiedTime: mtime !== 0 ? mtime : null,
            size,
            type,
          },
        });
      }
    }
  }

  /**
   * Closes the watcher.
   */
  async stopWatching(): Promise<void> {
    await super.stopWatching();
    if (this.#client) {
      this.#client.removeAllListeners();
      this.#client.end();
    }
    this.#deferringStates = null;
  }

  getPauseReason(): string | null | undefined {
    if (this.#deferringStates == null || this.#deferringStates.size === 0) {
      return null;
    }
    const states = [...this.#deferringStates];
    if (states.length === 1) {
      return `The watch is in the '${states[0]}' state.`;
    }
    return `The watch is in the ${states
      .slice(0, -1)
      .map((s) => `'${s}'`)
      .join(', ')} and '${states[states.length - 1]}' states.`;
  }
}

/**
 * Handles a warning in the watchman resp object.
 */
function handleWarning(resp: Readonly<{ warning?: unknown }>) {
  if ('warning' in resp) {
    if (RecrawlWarning.isRecrawlWarningDupe(resp.warning)) {
      return true;
    }
    console.warn(resp.warning);
    return true;
  } else {
    return false;
  }
}
