package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.events.normalizeEventName
import expo.modules.kotlin.logger
import expo.modules.kotlin.viewevent.ViewEventDelegate
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.jvm.isAccessible

class ViewManagerWrapperDelegate(internal var moduleHolder: ModuleHolder) {
  private val definition: ViewManagerDefinition
    get() = requireNotNull(moduleHolder.definition.viewManagerDefinition)

  internal val viewGroupDefinition: ViewGroupDefinition?
    get() = definition.viewGroupDefinition

  val name: String
    get() = moduleHolder.name

  fun createView(context: Context): View {
    return definition
      .createView(context, moduleHolder.module.appContext)
      .also {
        configureView(it)
      }
  }

  fun setProxiedProperties(view: View, proxiedProperties: ReadableMap) {
    definition.setProps(proxiedProperties, view)
    definition.onViewDidUpdateProps?.invoke(view)
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
          normalizeEventName(it), MapBuilder.of<String, Any>("registrationName", it)
        )
      }
    return builder.build()
  }

  private fun configureView(view: View) {
    val callbacks = definition.callbacksDefinition?.names ?: return

    val kClass = view.javaClass.kotlin
    val propertiesMap = kClass
      .declaredMemberProperties
      .associateBy { it.name }

    callbacks.forEach {
      val property = propertiesMap[it].ifNull {
        logger.warn("⚠️ Property `$it` does not exist in ${kClass.simpleName}")
        return@forEach
      }
      property.isAccessible = true

      val delegate = property.getDelegate(view).ifNull {
        logger.warn("⚠️ Property delegate for `$it` in ${kClass.simpleName} does not exist")
        return@forEach
      }

      val viewDelegate = (delegate as? ViewEventDelegate<*>).ifNull {
        logger.warn("⚠️ Property delegate for `$it` cannot be cased to `ViewCallbackDelegate`")
        return@forEach
      }

      viewDelegate.isValidated = true
    }
  }
}
