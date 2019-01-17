package expo.modules.bluetooth;

import expo.core.Promise;

public class BondingPromise {
  protected String uuid;
  protected Promise promise;

  BondingPromise(String uuid, Promise promise) {
    this.uuid = uuid;
    this.promise = promise;
  }
}