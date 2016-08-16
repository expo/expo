// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.util.Log;

import java.util.HashMap;
import java.util.Map;

import host.exp.exponent.analytics.EXL;

public class AsyncCondition {

  private static final String TAG = AsyncCondition.class.getSimpleName();

  public interface AsyncConditionListener {
    boolean isReady();

    void execute();
  }

  private static final Map<String, AsyncConditionListener> sMap = new HashMap<>();

  public static void wait(final String key, final AsyncConditionListener listener) {
    if (listener.isReady()) {
      listener.execute();
    } else {
      synchronized (sMap) {
        if (sMap.containsKey(key)) {
          EXL.e(TAG, "Map already contains entry for key " + key + ". Ignoring.");
          return;
        }

        sMap.put(key, listener);
      }
    }
  }

  public static void notify(final String key) {
    synchronized (sMap) {
      if (!sMap.containsKey(key)) {
        Log.w(TAG, "Could not find listener for key: " + key);
        return;
      }

      AsyncConditionListener listener = sMap.remove(key);
      if (listener.isReady()) {
        listener.execute();
      }
    }
  }

  public static void remove(final String key) {
    synchronized (sMap) {
      sMap.remove(key);
    }
  }
}
