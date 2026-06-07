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
import expo.modules.kotlin.views.ExpoView
import expo.modules.kotlin.views.ViewManagerDefinition

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
      val viewDefinition = resolveViewDefinition(view, appContext.registry)

      if (viewDefinition == null) {
        logger.warn("⚠️ Cannot find a view definition for ${view::class.java}")
        return
      }

      val callbacks = viewDefinition.callbacksDefinition.ifNull {
        logger.warn("⚠️ Cannot get callbacks for ${viewDefinition.name}")
        return
      }

      if (!callbacks.names.any { it == name }) {
        logger.warn("⚠️ Event $name wasn't exported from ${viewDefinition.name}")
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
 * Resolves the ViewManagerDefinition for view. ExpoViews carry their own, other views resolve by class. See https://github.com/expo/expo/issues/46623.
 */
internal fun resolveViewDefinition(view: View, registry: ModuleRegistry): ViewManagerDefinition? {
  (view as? ExpoView)?.viewDefinition?.let { return it }
  val holder = registry.getModuleHolder(view::class.java) ?: return null
  return registry.getViewDefinition(holder, view::class.java)
}
