package expo.modules.bluetooth.objects;

import expo.core.Promise;

public class ConnectingPromise {
  private Promise mPromise;
  private String mEvent;


  public ConnectingPromise(Promise promise, String event) {
    mPromise = promise;
    mEvent = event;
  }

  public Promise getPromise() {
    return mPromise;
  }

  public String getEvent() {
    return mEvent;
  }
}
