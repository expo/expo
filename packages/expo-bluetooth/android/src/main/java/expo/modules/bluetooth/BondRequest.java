package expo.modules.bluetooth;

import expo.core.Promise;

public class BondRequest {
  protected String uuid;
	protected Promise promise;

	BondRequest(String uuid, Promise promise) {
		this.uuid = uuid;
    this.promise = promise;
	}
}