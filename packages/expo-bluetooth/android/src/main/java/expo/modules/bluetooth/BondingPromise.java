package expo.modules.bluetooth;

import expo.core.Promise;

public class BondingPromise {
  protected String uuid;
  protected Promise promise;

  public BondingPromise(String uuid, Promise promise) {
    this.uuid = uuid;
    this.promise = promise;
  }

  public String getKey() {
    return uuid;
  }

  public Promise getPromise() {
    return promise;
  }
}