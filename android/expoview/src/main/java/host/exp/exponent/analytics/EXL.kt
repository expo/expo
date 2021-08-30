// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.analytics

import android.util.Log
import host.exp.exponent.Constants
import org.json.JSONObject

// EXpo Log
object EXL {
  private val TAG = EXL::class.java.simpleName

  // Use this for errors that we expect to happen in tests. They will only log it
  // they occur outside of a test environment.
  fun testError(e: Throwable) {
    if (!Constants.isTest()) {
      e.printStackTrace()
    }
  }

  @JvmStatic fun d(tag: String?, msg: String) {
    Log.d(tag, msg)
  }

  @JvmStatic fun w(tag: String?, msg: String) {
    Log.w(tag, msg)
  }

  // TODO send string version of Throwable to Amplitude
  @JvmStatic fun e(tag: String?, e: Throwable) {
    Log.e(tag, e.toString())
  }

  @JvmStatic fun e(tag: String?, msg: String?) {
    Log.e(tag, msg ?: "")

    try {
      val stackTrace = Log.getStackTraceString(Throwable())
      val eventProperties = JSONObject().apply {
        put("TAG", tag)
        put("MESSAGE", msg)
        put("STACK_TRACE", stackTrace)
      }
      Analytics.logEvent(Analytics.AnalyticsEvent.LOG_ERROR, eventProperties)
    } catch (e: Throwable) {
      Log.e(TAG, e.toString())
    }
  }
}
