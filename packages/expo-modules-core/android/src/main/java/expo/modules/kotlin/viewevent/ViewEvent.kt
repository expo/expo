package expo.modules.kotlin.viewevent

import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.ModuleRegistry
import expo.modules.kotlin.getUnimoduleProxy
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.JSTypeConverterProvider
import expo.modules.kotlin.types.putGeneric
import expo.modules.kotlin.views.CallbacksDefinition
import expo.modules.kotlin.views.ViewFunctionHolder

fun interface ViewEventCallback<T> {
  operator fun invoke(arg: T)
}

open class ViewEvent<T>(
  private val name: String,
  private val view: View,
  private val coalescingKey: CoalescingKey<T>?
) : ViewEventCallback<T> {
  private var isValidated = false

  override operator fun invoke(arg: T) {
    val reactContext = view.context as ReactContext
    val nativeModulesProxy = reactContext.getUnimoduleProxy() ?: return
    val appContext = nativeModulesProxy.kotlinInteropModuleRegistry.appContext

    if (!isValidated) {
      val callbacks = resolveCallbacksDefinition(view, appContext.registry).ifNull {
        logger.warn("⚠️ Cannot get callbacks for ${view::class.java}")
        return
      }

      if (!callbacks.names.any { it == name }) {
        logger.warn("⚠️ Event $name wasn't exported from ${view::class.java}")
        return
      }

      isValidated = true
    }

    appContext
      .callbackInvoker
      ?.emit(
        view = view,
        eventName = name,
        eventBody = convertEventBody(arg),
        coalescingKey = coalescingKey?.invoke(arg)
      )
  }

  private fun convertEventBody(arg: T): WritableMap? {
    return when (val converted = JSTypeConverterProvider.convertToJSValue(arg)) {
      is Unit, null -> null
      is WritableMap -> converted
      else -> JSTypeConverterProvider.DefaultContainerProvider.createMap().apply {
        putGeneric("payload", converted)
      }
    }
  }
}

/**
 * Resolves the callbacks declared for [view]. Views that reuse a single class
 * (e.g. ComposeFunctionHolder) carry their own [CallbacksDefinition] because they
 * can't be matched by class; everything else is looked up by class in the registry.
 * See https://github.com/expo/expo/issues/46623.
 */
internal fun resolveCallbacksDefinition(view: View, registry: ModuleRegistry): CallbacksDefinition? {
  if (view is ViewFunctionHolder) {
    return view.callbacksDefinition
  }
  val holder = registry.getModuleHolder(view::class.java) ?: return null
  return registry.getViewDefinition(holder, view::class.java)?.callbacksDefinition
}
