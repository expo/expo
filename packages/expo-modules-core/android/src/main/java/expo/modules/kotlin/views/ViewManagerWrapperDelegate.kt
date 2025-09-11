package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.events.normalizeEventName
import expo.modules.kotlin.exception.OnViewDidUpdatePropsException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.logger

class ViewManagerWrapperDelegate(internal var moduleHolder: ModuleHolder<*>, internal val definition: ViewManagerDefinition, internal val delegateName: String? = null) {
  internal val viewGroupDefinition: ViewGroupDefinition?
    get() = definition.viewGroupDefinition

  val name: String
    get() = delegateName ?: "${moduleHolder.name}_${definition.name}"

  val props: Map<String, AnyViewProp>
    get() = definition.props

  fun createView(context: Context): View {
    return definition
      .createView(context, moduleHolder.module.appContext)
  }

  fun onViewDidUpdateProps(view: View) {
    definition.onViewDidUpdateProps?.let {
      try {
        exceptionDecorator(
          { exception -> OnViewDidUpdatePropsException(view.javaClass.kotlin, exception) }
        ) {
          it.invoke(view)
        }
      } catch (exception: Throwable) {
        // The view wasn't constructed correctly, so errors are expected.
        // We can ignore them.
        if (view.isErrorView()) {
          return@let
        }

        val codedException = exception.toCodedException()
        logger.error("❌ Error occurred when invoking 'onViewDidUpdateProps' on '${view.javaClass.simpleName}'", codedException)
        definition.handleException(view, codedException)
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
        try {
          expoProp.set(propsMap.getDynamic(key), view, moduleHolder.module._runtimeContext?.appContext)
        } catch (exception: Throwable) {
          // The view wasn't constructed correctly, so errors are expected.
          // We can ignore them.
          if (view.isErrorView()) {
            return@let
          }

          val codedException = exception.toCodedException()
          logger.error("❌ Cannot set the '$name' prop on the '$view'", codedException)
          definition.handleException(
            view,
            codedException
          )
        } finally {
          handledProps.add(key)
        }
      }
    }
    return handledProps
  }

  fun onDestroy(view: View) {
    try {
      definition.onViewDestroys?.invoke(view)
    } catch (exception: Throwable) {
      // The view wasn't constructed correctly, so errors are expected.
      // We can ignore them.
      if (view.isErrorView()) {
        return
      }

      val codedException = exception.toCodedException()
      logger.error("❌ '$view' wasn't able to destroy itself", codedException)
      definition.handleException(
        view,
        codedException
      )
    }
  }

  fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? = buildMap {
    definition
      .callbacksDefinition
      ?.names
      ?.forEach {
        put(
          normalizeEventName(it),
          mapOf("registrationName" to it)
        )
      }
  }
}
