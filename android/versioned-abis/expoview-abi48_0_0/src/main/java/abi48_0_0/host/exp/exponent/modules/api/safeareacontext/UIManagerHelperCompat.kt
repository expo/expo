package abi48_0_0.host.exp.exponent.modules.api.safeareacontext

import android.content.Context
import android.content.ContextWrapper
import android.view.View
import abi48_0_0.com.facebook.react.bridge.ReactContext

/** UIManagerHelper.getReactContext only exists in RN 0.63+ so vendor it here for a while. */
fun getReactContext(view: View): ReactContext {
  var context = view.context
  if (context !is ReactContext && context is ContextWrapper) {
    context = context.baseContext
  }
  return context as ReactContext
}

/** UIManagerHelper.getSurfaceId only exists in RN 0.65+, surface id is only needed for new arch. */
fun getSurfaceId(@Suppress("UNUSED_PARAMETER") context: Context): Int {
  return -1
}
