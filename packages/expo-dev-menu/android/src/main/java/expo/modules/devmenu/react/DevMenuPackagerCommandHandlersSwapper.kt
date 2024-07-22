package expo.modules.devmenu.react

import android.util.Log
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.JSPackagerClient
import com.facebook.react.packagerconnection.RequestHandler
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.helpers.getPrivateDeclaredFieldValue
import expo.modules.devmenu.helpers.setPrivateDeclaredFieldValue
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class DevMenuPackagerCommandHandlersSwapper {
  fun swapPackagerCommandHandlers(
    reactHost: ReactHostWrapper,
    handlers: Map<String, RequestHandler>
  ) {
    try {
      val devSupportManager: DevSupportManager = requireNotNull(reactHost.devSupportManager)

      // We don't want to add handlers into `DisabledDevSupportManager` or other custom classes
      if (devSupportManager !is DevSupportManagerBase) {
        return
      }

      val currentCommandHandlers: Map<String, RequestHandler>? =
        DevSupportManagerBase::class.java.getPrivateDeclaredFieldValue(
          "mCustomPackagerCommandHandlers",
          devSupportManager
        )

      val newCommandHandlers = currentCommandHandlers?.toMutableMap() ?: mutableMapOf()
      newCommandHandlers.putAll(handlers)

      DevSupportManagerBase::class.java.setPrivateDeclaredFieldValue(
        "mCustomPackagerCommandHandlers",
        devSupportManager,
        newCommandHandlers
      )

      swapCurrentCommandHandlers(reactHost, handlers)
    } catch (e: Exception) {
      Log.w("DevMenu", "Couldn't add packager command handlers to current client: ${e.message}", e)
    }
  }

  /**
   * No matter where we swap the command handlers there always will be an instance of [JSPackagerClient]
   * that was created before swapping. The only place where you can add custom handlers,
   * is in the [com.facebook.react.ReactInstanceManagerBuilder.setCustomPackagerCommandHandlers].
   * Unfortunately, we don't have access to this function. What's worst, we can't even add a new installation step.
   * The builder is hidden from the user.
   *
   * So we need to swap command handlers in the current [JSPackagerClient] instance.
   * However, we can't just use the reflection API to access handlers variable inside that object,
   * cause we don't know if it is available. [JSPackagerClient] is created on background thread (see [DevServerHelper.openPackagerConnection]).
   * The final solution is to spin a background task that monitors if the client is present.
   */
  private fun swapCurrentCommandHandlers(
    reactHost: ReactHostWrapper,
    handlers: Map<String, RequestHandler>
  ) {
    DevMenuManager.coroutineScope.launch {
      try {
        while (true) {
          val devSupportManager = requireNotNull(reactHost.devSupportManager)

          val devServerHelper: DevServerHelper =
            DevSupportManagerBase::class.java.getPrivateDeclaredFieldValue(
              "mDevServerHelper",
              devSupportManager
            )

          val jsPackagerClient: JSPackagerClient? =
            DevServerHelper::class.java.getPrivateDeclaredFieldValue(
              "mPackagerClient",
              devServerHelper
            )

          if (jsPackagerClient != null) {
            val currentCommandHandlers: Map<String, RequestHandler>? =
              JSPackagerClient::class.java.getPrivateDeclaredFieldValue(
                "mRequestHandlers",
                jsPackagerClient
              )

            val newCommandHandlers = currentCommandHandlers?.toMutableMap() ?: mutableMapOf()
            newCommandHandlers.putAll(handlers)
            JSPackagerClient::class.java.setPrivateDeclaredFieldValue(
              "mRequestHandlers",
              jsPackagerClient,
              newCommandHandlers
            )

            return@launch
          }

          delay(50)
        }
      } catch (e: Exception) {
        Log.w("DevMenu", "Couldn't add packager command handlers to current client: ${e.message}", e)
      }
    }
  }
}
