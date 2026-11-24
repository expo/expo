package expo.modules.kotlin.types

import android.content.Context
import android.view.View
import androidx.annotation.UiThread
import com.facebook.react.uimanager.UIManagerHelper
import expo.modules.kotlin.Utils
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.runtime.Runtime

/**
 * Provides the application context and JavaScript runtime that may be used during type conversion.
 */
interface ConverterContext {
  val applicationContext: Context
  val runtime: Runtime?

  @Suppress("UNCHECKED_CAST")
  @UiThread
  fun <T : View> findView(viewTag: Int): T? {
    val runtime = runtime ?: throw Exceptions.RuntimeLost()
    val reactContext = runtime.reactContext ?: return null
    return UIManagerHelper
      .getUIManagerForReactTag(reactContext, viewTag)
      ?.resolveView(viewTag) as? T
  }

  fun assertMainThread() {
    Utils.assertMainThread()
  }
}
