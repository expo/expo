package versioned.host.exp.exponent.modules.api.safeareacontext

import com.facebook.react.bridge.ReactContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import versioned.host.exp.exponent.modules.api.safeareacontext.RNCSafeAreaProviderManagerDelegate
import versioned.host.exp.exponent.modules.api.safeareacontext.RNCSafeAreaProviderManagerInterface

@ReactModule(name = SafeAreaProviderManager.REACT_CLASS)
class SafeAreaProviderManager :
    ViewGroupManager<SafeAreaProvider>(), RNCSafeAreaProviderManagerInterface<SafeAreaProvider> {
  private val mDelegate = RNCSafeAreaProviderManagerDelegate(this)

  override fun getDelegate() = mDelegate

  override fun getName() = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext) = SafeAreaProvider(context)

  override fun getExportedCustomDirectEventTypeConstants() =
      mutableMapOf(
          InsetsChangeEvent.EVENT_NAME to mutableMapOf("registrationName" to "onInsetsChange"))

  override fun addEventEmitters(reactContext: ThemedReactContext, view: SafeAreaProvider) {
    super.addEventEmitters(reactContext, view)
    view.setOnInsetsChangeHandler(::handleOnInsetsChange)
  }

  companion object {
    const val REACT_CLASS = "RNCSafeAreaProvider"
  }
}

private fun handleOnInsetsChange(view: SafeAreaProvider, insets: EdgeInsets, frame: Rect) {
  val reactContext = view.context as ReactContext
  val reactTag = view.id
  UIManagerHelper.getEventDispatcherForReactTag(reactContext, reactTag)
      ?.dispatchEvent(InsetsChangeEvent(getSurfaceId(reactContext), reactTag, insets, frame))
}
