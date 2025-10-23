package expo.modules.logbox

import android.util.Log
import com.facebook.react.ReactHost
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.runtime.ReactHostImpl

fun injectExpoLogBoxDevSupportManager(reactHost: ReactHost?) {
  val currentDevSupportManager = reactHost?.devSupportManager

  if (currentDevSupportManager == null) {
    Log.w(
      "ExpoLogBox",
      "ReactHost initialized without a dev support manager, ExpoLogBox can't be initialized."
    )
    return
  } else if (currentDevSupportManager is ExpoLogBoxDevSupportManager) {
    Log.i(
      "ExpoLogBox",
      "DevSupportManager is already `ExpoDevSupportManagerWithLogBoxOverride`, skipping initialization."
    )
    return
  }
  // NOTE(@krystofwoldrich): This will overwrite expo-dev-client dev support manager

  try {
    val newDevSupportManager =
      createExpoLogBoxBridgelessDevSupportManager(
        currentDevSupportManager
      )

    ReactHostImpl::class.java.setProtectedDeclaredField(
      reactHost,
      "devSupportManager",
      newDevSupportManager
    )
  } catch (e: Exception) {
    Log.i("ExpoLogBox", "Couldn't inject `ExpoDevSupportManagerWithLogBoxOverride`.", e)
  }
}

fun createExpoLogBoxBridgelessDevSupportManager(
  currentDevSupportManager: DevSupportManager,
  devManagerClass: Class<*> = DevSupportManagerBase::class.java
): ExpoLogBoxDevSupportManager {
  return ExpoLogBoxDevSupportManager(
    applicationContext = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "applicationContext"),
    reactInstanceManagerHelper = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "reactInstanceDevHelper"),
    packagerPathForJSBundleName = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "jsAppBundleName"),
    enableOnCreate = true,
    redBoxHandler = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "redBoxHandler"),
    devBundleDownloadListener = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "devBundleDownloadListener"),
    minNumShakes = 1,
    customPackagerCommandHandlers = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "customPackagerCommandHandlers"),
    surfaceDelegateFactory = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "surfaceDelegateFactory"),
    devLoadingViewManager = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "devLoadingViewManager"),
    pausedInDebuggerOverlayManager = devManagerClass.getProtectedFieldValue(currentDevSupportManager, "pausedInDebuggerOverlayManager")
  )
}
