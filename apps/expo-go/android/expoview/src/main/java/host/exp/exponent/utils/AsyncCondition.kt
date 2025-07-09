// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import android.util.Log
import host.exp.exponent.analytics.EXL

object AsyncCondition {
  private val TAG = AsyncCondition::class.java.simpleName

  private val listenerMap = mutableMapOf<String, AsyncConditionListener>()

  @JvmStatic fun wait(key: String, listener: AsyncConditionListener) {
    if (listener.isReady()) {
      listener.execute()
    } else {
      synchronized(listenerMap) {
        if (listenerMap.containsKey(key)) {
          EXL.e(TAG, "Map already contains entry for key $key. Ignoring.")
          return
        }
        listenerMap.put(key, listener)
      }
    }
  }

  @JvmStatic fun notify(key: String) {
    synchronized(listenerMap) {
      if (!listenerMap.containsKey(key)) {
        Log.w(TAG, "Could not find listener for key: $key")
        return
      }
      val listener = listenerMap.remove(key)
      if (listener!!.isReady()) {
        listener.execute()
      }
    }
  }

  @JvmStatic fun remove(key: String) {
    synchronized(listenerMap) { listenerMap.remove(key) }
  }

  interface AsyncConditionListener {
    fun isReady(): Boolean
    fun execute()
  }
}
