package expo.modules.kotlin.views

import android.content.Context
import android.util.Log
import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.callbacks.ViewCallbackDelegate
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.jvm.isAccessible

class ViewManagerWrapperDelegate(internal var moduleHolder: ModuleHolder) {
  private val definition: ViewManagerDefinition
    get() = requireNotNull(moduleHolder.definition.viewManagerDefinition)

  val name: String
    get() = moduleHolder.name

  fun createView(context: Context): View {
    return definition
      .createView(context)
      .also {
        configureView(it)
      }
  }

  fun setProxiedProperties(view: View, proxiedProperties: ReadableMap) {
    definition.setProps(proxiedProperties, view)
  }

  fun onDestroy(view: View) =
    definition.onViewDestroys?.invoke(view)

  fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
    val builder = MapBuilder.builder<String, Any>()
    definition
      .callbacksDefinition
      ?.names
      ?.forEach {
        builder.put(
          it, MapBuilder.of<String, Any>("registrationName", it)
        )
      }
    return builder.build()
  }

  private fun configureView(view: View) {
    val callbacks = definition.callbacksDefinition?.names ?: return

    val kClass = view.javaClass.kotlin
    val propertiesMap = kClass
      .declaredMemberProperties
      .map { it.name to it }
      .toMap()

    callbacks.forEach {
      val property = propertiesMap[it].ifNull {
        Log.w("ExpoModuleCore", "Property `$it` does not exist in ${kClass.simpleName}.")
        return@forEach
      }
      property.isAccessible = true

      val delegate = property.getDelegate(view).ifNull {
        Log.w("ExpoModulesCore", "Property delegate for `$it` in ${kClass.simpleName} does not exist.")
        return@forEach
      }

      val viewDelegate = (delegate as? ViewCallbackDelegate<*>).ifNull {
        Log.w("ExpoModulesCore", "Property delegate for `$it` cannot be cased to `ViewCallbackDelegate`.")
        return@forEach
      }

      viewDelegate.isValidated = true
    }
  }
}
