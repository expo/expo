package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.BaseAsyncFunctionComponent
import expo.modules.kotlin.getUnimoduleProxy

class ViewManagerDefinition(
  private val viewFactory: (Context, AppContext) -> View,
  internal val viewType: Class<out View>,
  internal val props: Map<String, AnyViewProp>,
  val onViewDestroys: ((View) -> Unit)? = null,
  val callbacksDefinition: CallbacksDefinition? = null,
  val viewGroupDefinition: ViewGroupDefinition? = null,
  val onViewDidUpdateProps: ((View) -> Unit)? = null,
  val asyncFunctions: List<BaseAsyncFunctionComponent> = emptyList()
) {

  fun createView(context: Context, appContext: AppContext): View = viewFactory(context, appContext)

  val propsNames: List<String> = props.keys.toList()

  fun getViewManagerType(): ViewManagerType {
    return if (ViewGroup::class.java.isAssignableFrom(viewType)) {
      ViewManagerType.GROUP
    } else {
      ViewManagerType.SIMPLE
    }
  }

  fun handleException(view: View, exception: CodedException) {
    val reactContext = (view.context as? ReactContext) ?: return
    val nativeModulesProxy = reactContext.getUnimoduleProxy() ?: return
    val appContext = nativeModulesProxy.kotlinInteropModuleRegistry.appContext

    appContext.errorManager?.reportExceptionToLogBox(exception)
  }
}
