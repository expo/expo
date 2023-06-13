package abi47_0_0.expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import abi47_0_0.com.facebook.react.bridge.ReactContext
import abi47_0_0.com.facebook.react.bridge.ReadableMap
import abi47_0_0.expo.modules.adapters.react.NativeModulesProxy
import abi47_0_0.expo.modules.core.ViewManager
import abi47_0_0.expo.modules.kotlin.AppContext
import abi47_0_0.expo.modules.kotlin.exception.CodedException
import abi47_0_0.expo.modules.kotlin.exception.UnexpectedException
import abi47_0_0.expo.modules.kotlin.logger
import abi47_0_0.expo.modules.kotlin.recycle

class ViewManagerDefinition(
  private val viewFactory: (Context, AppContext) -> View,
  private val viewType: Class<out View>,
  private val props: Map<String, AnyViewProp>,
  val onViewDestroys: ((View) -> Unit)? = null,
  val callbacksDefinition: CallbacksDefinition? = null,
  val viewGroupDefinition: ViewGroupDefinition? = null,
  val onViewDidUpdateProps: ((View) -> Unit)? = null
) {

  fun createView(context: Context, appContext: AppContext): View = viewFactory(context, appContext)

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
          logger.error("❌ Cannot set the '$key' prop on the '${viewType.simpleName}'", exception)

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
