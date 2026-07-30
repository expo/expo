// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.JavascriptException
import host.exp.expoview.Exponent

@DoNotStrip
object ReactNativeStaticHelpers {
  @DoNotStrip
  @JvmStatic fun handleReactNativeError(
    errorMessage: String,
    stackUnversioned: Any?,
    exceptionId: Int?,
    isFatal: Boolean?
  ) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel").getMethod(
        "handleReactNativeError",
        String::class.java,
        Any::class.java,
        Int::class.java,
        Boolean::class.java
      ).invoke(null, errorMessage, stackUnversioned, exceptionId, isFatal)
    } catch (e: Exception) {
      throw JavascriptException(errorMessage)
    }
  }

  @DoNotStrip
  @JvmStatic fun handleReactNativeError(
    throwable: Throwable?,
    errorMessage: String,
    stackUnversioned: Any?,
    exceptionId: Int?,
    isFatal: Boolean?
  ) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel").getMethod(
        "handleReactNativeError",
        Throwable::class.java,
        String::class.java,
        Any::class.java,
        Int::class.java,
        Boolean::class.java
      ).invoke(null, throwable, errorMessage, stackUnversioned, exceptionId, isFatal)
    } catch (e: Exception) {
      throw JavascriptException(errorMessage)
    }
  }

  @DoNotStrip
  @JvmStatic fun getBundleSourceForPath(path: String?): String? {
    return try {
      Exponent.instance.getBundleSource(path!!)
    } catch (e: Exception) {
      null
    }
  }
}
