import type { NavigationState } from '../react-navigation/routers';
import { LoaderClient } from './LoaderClient';
import { LoaderSuspenseStore } from './LoaderSuspenseStore';
import type { LoaderFetcher, LoaderResult } from './types';

export const ROOT_LOADER_OWNER = Symbol('root loader owner');
type LoaderOwner = string | typeof ROOT_LOADER_OWNER;
type Owner = { speculative: boolean; retained: boolean; awaiting: boolean; stale: boolean };
type LoaderRecord = {
  path: string;
  hydrated?: boolean;
  owners: Map<LoaderOwner, Owner>;
  observers: Set<() => void>;
};
const snapshot = Symbol('loader read snapshot');
type Snapshot = {
  runtime: LoaderRuntime;
  record: LoaderRecord;
  owner: LoaderOwner;
  version: number;
};
export type LoaderRead<T> = {
  ready: PromiseLike<void>;
  get(): T;
  readonly [snapshot]: Snapshot;
};
const READY = Object.assign(Promise.resolve(), { status: 'fulfilled', value: undefined });

export const activeLoaderRuntimes = new Set<LoaderRuntime>();

/** Owns requests, Suspense reads, and route claims for one router root. */
export class LoaderRuntime {
  private client: LoaderClient;
  private store = new LoaderSuspenseStore();
  private records = new Map<string, LoaderRecord>();
  private claims = new Map<string, LoaderRecord>();
  private focusedNavigators = new Map<string, Set<object>>();
  private navigationState?: NavigationState;
  private liveRoutes = new Set<string>();
  private mounts = 0;

  constructor(fetcher?: LoaderFetcher) {
    this.client = new LoaderClient(fetcher);
  }

  read<T>(owner: LoaderOwner, path: string): LoaderRead<T> {
    let record = this.records.get(path);
    if (!record) {
      record = { path, owners: new Map(), observers: new Set() };
      this.records.set(path, record);
    }
    const freshVisit =
      this.store.value(path) &&
      !record.hydrated &&
      (record.owners.get(owner)?.stale ||
        (!record.owners.has(owner) &&
          [...record.owners.values()].every((claim) => claim.speculative)));
    const claim = this.acquire(record, owner);
    const hydration = globalThis.__EXPO_ROUTER_LOADER_DATA__;
    if (hydration && path in hydration) {
      if (this.store.seed(path, hydration[path])) record.hydrated = true;
      delete hydration[path];
    }
    if (this.store.value(path) && !this.client.isLoading(path)) claim.awaiting = false;
    if (freshVisit) {
      claim.awaiting = true;
      claim.stale = false;
    }
    if ((!this.store.value(path) || freshVisit) && !this.client.isLoading(path)) this.start(record);

    const seen: Snapshot = { runtime: this, record, owner, version: this.store.version(path) };
    return {
      [snapshot]: seen,
      ready: claim.awaiting ? (this.store.pending(path) ?? READY) : READY,
      get: () => {
        // React may replay using an older fulfilled thenable after cancellation. Read the
        // current generation, and suspend again if its replacement is still pending.
        const current = this.records.get(path);
        if (!current || (!this.store.value(path) && !this.client.isLoading(path))) {
          return this.read<T>(owner, path).get();
        }
        return this.getValue<T>(current, current === record && claim.awaiting);
      },
    };
  }

  attach(read: LoaderRead<unknown>, onChange: () => void): () => void {
    const seen = read[snapshot];
    if (seen.runtime !== this) {
      throw new Error(
        'The loader read belongs to another router root. Attach it with the runtime that created it.'
      );
    }
    const { record, owner } = seen;
    if (this.records.get(record.path) !== record) {
      const detach = this.attach(this.read(owner, record.path), onChange);
      onChange();
      return detach;
    }
    this.acquire(record, owner);
    const claim = record.owners.get(owner)!;
    claim.speculative = false;
    record.hydrated = false;
    record.observers.add(onChange);

    if (owner !== ROOT_LOADER_OWNER && this.claims.get(owner) !== record) {
      this.claims.set(owner, record);
      // A route has one contextual loader path, even if its reader remounts. An interrupted
      // candidate can finish, but returning to it after this commit must fetch fresh data.
      for (const candidate of this.records.values()) {
        if (candidate === record) continue;
        const previous = candidate.owners.get(owner);
        if (!previous) continue;
        if (previous.speculative) previous.stale = true;
        else candidate.owners.delete(owner);
        this.releaseIfUnused(candidate);
      }
    }
    if (
      this.store.version(record.path) !== seen.version ||
      this.records.get(record.path) !== record
    )
      onChange();
    // Activity disconnects effects without removing the route's claims.
    return () => {
      record.observers.delete(onChange);
      this.releaseIfUnused(record);
    };
  }

  commit(state: NavigationState) {
    this.navigationState = state;
    this.reconcile();
  }

  setRetention(navigatorKey: string, _mode: 'focused'): () => void {
    const registration = {};
    let registrations = this.focusedNavigators.get(navigatorKey);
    if (!registrations) this.focusedNavigators.set(navigatorKey, (registrations = new Set()));
    registrations.add(registration);
    // Batch effect replay and navigator replacements before reconciling the last committed tree.
    queueMicrotask(() => this.reconcile());
    return () => {
      registrations.delete(registration);
      if (registrations.size === 0 && this.focusedNavigators.get(navigatorKey) === registrations) {
        this.focusedNavigators.delete(navigatorKey);
      }
      queueMicrotask(() => this.reconcile());
    };
  }

  mount(): () => void {
    this.mounts++;
    activeLoaderRuntimes.add(this);
    let mounted = true;
    return () => {
      if (!mounted) return;
      mounted = false;
      this.mounts--;
      if (this.mounts === 0) activeLoaderRuntimes.delete(this);
      queueMicrotask(() => {
        if (this.mounts === 0) this.dispose();
      });
    };
  }

  invalidate() {
    for (const record of [...this.records.values()]) {
      if (record.owners.size === 0) this.releaseIfUnused(record);
      else this.start(record);
    }
  }

  /** Read-only inspection for diagnostics. */
  peek(path: string): LoaderResult | Promise<void> | undefined {
    return this.store.value(path) ?? this.store.pending(path);
  }

  private dispose() {
    this.navigationState = undefined;
    this.liveRoutes.clear();
    this.focusedNavigators.clear();
    this.claims.clear();
    for (const record of [...this.records.values()]) {
      record.owners.clear();
      this.releaseIfUnused(record);
    }
  }

  private acquire(record: LoaderRecord, owner: LoaderOwner) {
    if (!record.owners.has(owner)) {
      record.owners.set(owner, {
        speculative: true,
        retained: owner === ROOT_LOADER_OWNER || this.liveRoutes.has(owner),
        awaiting: !this.store.value(record.path),
        stale: false,
      });
    }
    return record.owners.get(owner)!;
  }

  private getValue<T>(record: LoaderRecord, awaiting: boolean): T {
    const value = this.store.value(record.path);
    if (!value || (awaiting && this.client.isLoading(record.path))) {
      throw this.store.pending(record.path)!;
    }
    if ('error' in value) {
      queueMicrotask(() => this.store.evict(record.path, value));
      throw value.error;
    }
    return value.data as T; // The hook's loader type supplies the result type at this boundary.
  }

  private reconcile() {
    if (!this.navigationState) return;
    const live = new Set<string>();
    const visit = (state: NavigationState) => {
      const focusedOnly = this.focusedNavigators.has(state.key);
      for (const [index, route] of state.routes.entries()) {
        if (focusedOnly && index !== state.index) continue;
        live.add(route.key);
        if (route.state?.stale === false) visit(route.state);
      }
    };
    visit(this.navigationState);
    this.liveRoutes = live;
    for (const record of this.records.values()) {
      record.hydrated = false;
      for (const [key, owner] of record.owners) {
        if (key === ROOT_LOADER_OWNER || live.has(key)) owner.retained = true;
        else if (owner.retained) {
          if (this.claims.get(key) === record) this.claims.delete(key);
          record.owners.delete(key);
        }
      }
      this.releaseIfUnused(record);
    }
  }

  private releaseIfUnused(record: LoaderRecord) {
    if (record.owners.size > 0) return;
    record.hydrated = false;
    if (record.observers.size === 0 && this.records.get(record.path) === record) {
      this.records.delete(record.path);
    }
    this.store.release(record.path);
    this.client.abort(record.path);
  }

  private start(record: LoaderRecord) {
    this.store.suspend(record.path);
    if (!this.store.value(record.path)) {
      for (const owner of record.owners.values()) owner.awaiting = true;
    }
    this.client.start(record.path, (result) => this.settle(record, result));
  }

  private settle(record: LoaderRecord, value: LoaderResult) {
    for (const owner of record.owners.values()) owner.awaiting = false;
    this.store.settle(record.path, value);
    for (const onChange of record.observers) onChange();
  }
}
