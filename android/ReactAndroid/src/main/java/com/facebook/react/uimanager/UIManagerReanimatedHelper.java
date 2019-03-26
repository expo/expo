package com.facebook.react.uimanager;

/**
 * This class provides a way to workaround limited visibility of UIViewOperationQueue#getUIViewOperationQueue.
 * We rely on accessing that method to check if operation queue is empty or not. This in turn indicates if
 * we are in a middle of processing batch of operations from JS. In such a case we can rely on the enqueued update
 * operations to be flushed onto the shadow view hierarchy. Otherwise we want to trigger "dispatchViewUpdates" and
 * enforce flush immediately.
 */
public class UIManagerReanimatedHelper {
  public static boolean isOperationQueueEmpty(UIImplementation uiImplementation) {
    return uiImplementation.getUIViewOperationQueue().isEmpty();
  }
}