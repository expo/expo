package expo.modules.kotlin.views

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.core.ViewManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.recycle

class ViewManagerDefinition(
  private val viewFactory: (Context) -> View,
  private val viewType: Class<out View>,
  private val props: Map<String, AnyViewProp>,
  val onViewDestroys: ((View) -> Unit)? = null,
  val callbacksDefinition: CallbacksDefinition? = null,
  val viewGroupDefinition: ViewGroupDefinition? = null
) {

  fun createView(context: Context): View = viewFactory(context)

  val propsNames: List<String> = props.keys.toList()

  fun getViewManagerType(): ViewManager.ViewManagerType {
    return if (ViewGroup::class.java.isAssignableFrom(viewType)) {
      ViewManager.ViewManagerType.GROUP
    } else {
      ViewManager.ViewManagerType.SIMPLE
    }
  }

  fun setProps(propsToSet: ReadableMap, onView: View) {
    val iterator = propsToSet.keySetIterator()
    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      val propDelegate = props[key] ?: continue
      propsToSet.getDynamic(key).recycle {
        try {
          propDelegate.set(this, onView)
        } catch (exception: Throwable) {
          Log.e("ExpoModulesCore", "Cannot set the '$key' prop on the '${viewType.simpleName}'.", exception)

          handleException(
            onView,
            when (exception) {
              is CodedException -> exception
              else -> UnexpectedException(exception)
            }
          )
        }
      }
    }
  }

  fun handleException(view: View, exception: CodedException) {
    val reactContext = (view.context as? ReactContext) ?: return
    val nativeModulesProxy = reactContext
      .catalystInstance
      ?.getNativeModule("NativeUnimoduleProxy") as? NativeModulesProxy
      ?: return
    val appContext = nativeModulesProxy.kotlinInteropModuleRegistry.appContext

    appContext.errorManager?.reportExceptionToLogBox(exception)
  }
}
