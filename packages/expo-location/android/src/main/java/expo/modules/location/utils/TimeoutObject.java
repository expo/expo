// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.location.utils;

import android.os.Handler;

public class TimeoutObject {

  public interface TimeoutListener {
    void onTimeout();
  }

  private Long mTimeout;
  private boolean mIsDone = false;
  private TimeoutListener mListener;

  public TimeoutObject(final Long timeout) {
    mTimeout = timeout;
  }

  public void onTimeout(final TimeoutListener listener) {
    mListener = listener;
  }

  public void start() {
    if (mTimeout == null) {
      return;
    }

    new Handler().postDelayed(new Runnable() {
      @Override
      public void run() {
        synchronized (this) {
          if (!mIsDone) {
            if (mListener != null) {
              mListener.onTimeout();
            }
          }
          mIsDone = true;
        }
      }
    }, mTimeout);
  }

  public boolean markDoneIfNotTimedOut() {
    synchronized (this) {
      if (mIsDone) {
        return false;
      } else {
        mIsDone = true;
        return true;
      }
    }
  }
}
