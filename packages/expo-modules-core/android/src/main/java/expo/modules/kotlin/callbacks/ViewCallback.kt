package expo.modules.kotlin.callbacks

import android.os.Bundle
import android.view.View
import com.facebook.react.bridge.ReactContext
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.kotlin.modules.Module
import kotlin.reflect.KType

class ViewCallback<T>(
  private val name: String,
  private val type: KType,
  private val view: View
) : Callback<T> {
  internal lateinit var module: Module

  override operator fun invoke(arg: T) {
    val reactContext = view.context as ReactContext
    val nativeModulesProxy = reactContext
      .catalystInstance
      ?.getNativeModule("NativeUnimoduleProxy") as? NativeModulesProxy
      ?: return
    val appContext = nativeModulesProxy.kotlinInteropModuleRegistry.appContext

    // TODO(@lukmccall): handles other types
    appContext.callbackInvoker?.emit(view.id, name, arg as Bundle)
  }
}
