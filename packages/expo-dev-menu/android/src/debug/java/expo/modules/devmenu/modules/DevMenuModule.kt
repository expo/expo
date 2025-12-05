package expo.modules.devmenu.modules

import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.devmenu.api.DevMenuApi
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuState
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.weak

data class DevMenuCallback(
  @Field
  val name: String,
  @Field
  val shouldCollapse: Boolean = true
) : Record

class DevMenuModule : Module() {
  val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

  private val _viewModel by DevMenuApi.model { currentActivity }
  val viewModel
    get() = _viewModel ?: throw IllegalStateException("Dev Menu is not initialized")

  override fun definition() = ModuleDefinition {
    Name("ExpoDevMenu")

    AsyncFunction<Unit>("openMenu") {
      viewModel.onAction(DevMenuAction.Open)
    }

    AsyncFunction<Unit>("closeMenu") {
      viewModel.onAction(DevMenuAction.Close)
    }

    AsyncFunction<Unit>("hideMenu") {
      viewModel.onAction(DevMenuAction.Close)
    }

    AsyncFunction("addDevMenuCallbacks") { callbacks: List<DevMenuCallback> ->
      val reactContext = appContext.reactContext as? ReactContext
        ?: throw Exceptions.ReactContextLost()
      val reactContextHolder = reactContext.weak()

      viewModel.updateCustomItems(
        callbacks.map {
          DevMenuState.CustomItem(
            it.name,
            it.shouldCollapse
          ) {
            val eventEmitter = reactContextHolder
              .get()
              ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)

            eventEmitter?.emit("registeredCallbackFired", it.name)
          }
        }
      )
    }
  }
}
