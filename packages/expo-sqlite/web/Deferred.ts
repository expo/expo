// Copyright 2015-present 650 Industries. All rights reserved.

type DeferredResolve<T> = (value: T | PromiseLike<T>) => void;
type DeferredReject = (reason?: any) => void;

export class Deferred<T = any> {
  promise: Promise<T>;
  private resolveCallback!: DeferredResolve<T>;
  private rejectCallback!: DeferredReject;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolveCallback = resolve;
      this.rejectCallback = reject;
    });
  }

  resolve(value: T) {
    this.resolveCallback(value);
  }

  reject(reason: any) {
    this.rejectCallback(reason);
  }

  getPromise(): Promise<T> {
    return this.promise;
  }
}
