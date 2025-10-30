package expo.modules.devmenu.modules

import com.facebook.react.bridge.*
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.compose.DevMenuFragment
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DevMenuModule : Module() {
  val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

  private val _viewModel by DevMenuFragment.model { currentActivity }
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

    AsyncFunction("addDevMenuCallbacks") { callbacks: ReadableArray ->
      DevMenuManager.registeredCallbacks.clear()

      val size = callbacks.size()
      for (i in 0 until size) {
        val callback = callbacks.getMap(i) ?: continue
        val name = callback.getString("name") ?: continue
        val shouldCollapse = if (callback.hasKey("shouldCollapse")) {
          callback.getBoolean("shouldCollapse")
        } else {
          true
        }
        DevMenuManager.registeredCallbacks.add(DevMenuManager.Callback(name, shouldCollapse))
      }

      DevMenuManager.refreshCustomItems()
    }

    OnDestroy {
      DevMenuManager.registeredCallbacks.clear()
    }
  }
}
