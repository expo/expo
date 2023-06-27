package abi49_0_0.expo.modules.kotlin.views

import android.content.Context
import android.view.View
import abi49_0_0.com.facebook.react.bridge.ReadableMap
import abi49_0_0.com.facebook.react.common.MapBuilder
import abi49_0_0.expo.modules.core.utilities.ifNull
import abi49_0_0.expo.modules.kotlin.ModuleHolder
import abi49_0_0.expo.modules.kotlin.events.normalizeEventName
import abi49_0_0.expo.modules.kotlin.exception.CodedException
import abi49_0_0.expo.modules.kotlin.exception.OnViewDidUpdatePropsException
import abi49_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi49_0_0.expo.modules.kotlin.logger
import abi49_0_0.expo.modules.kotlin.viewevent.ViewEventDelegate
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.jvm.isAccessible

class ViewManagerWrapperDelegate(internal var moduleHolder: ModuleHolder) {
  private val definition: ViewManagerDefinition
    get() = requireNotNull(moduleHolder.definition.viewManagerDefinition)

  internal val viewGroupDefinition: ViewGroupDefinition?
    get() = definition.viewGroupDefinition

  val name: String
    get() = moduleHolder.name

  val props: Map<String, AnyViewProp>
    get() = definition.props

  fun createView(context: Context): View {
    return definition
      .createView(context, moduleHolder.module.appContext)
      .also {
        configureView(it)
      }
  }

  fun onViewDidUpdateProps(view: View) {
    definition.onViewDidUpdateProps?.let {
      try {
        exceptionDecorator({ OnViewDidUpdatePropsException(view.javaClass.kotlin, it) }) {
          it.invoke(view)
        }
      } catch (exception: CodedException) {
        logger.error("❌ Error occurred when invoking 'onViewDidUpdateProps' on '${view.javaClass.simpleName}'", exception)
        definition.handleException(view, exception)
      }
    }
  }

  /**
   * Updates the expo related properties of a given View based on a ReadableMap of property values.
   *
   * @param view The View whose properties should be updated.
   * @param propsMap A ReadableMap of property values.
   *
   * @return A List of property names that were successfully updated.
   */
  fun updateProperties(view: View, propsMap: ReadableMap): List<String> {
    val expoProps = props
    val handledProps = mutableListOf<String>()
    val iterator = propsMap.keySetIterator()

    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      expoProps[key]?.let { expoProp ->
        expoProp.set(propsMap.getDynamic(key), view)
        handledProps.add(key)
      }
    }
    return handledProps
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
