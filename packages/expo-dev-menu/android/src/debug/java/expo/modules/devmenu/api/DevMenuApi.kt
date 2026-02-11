package expo.modules.devmenu.api

import android.app.Activity
import android.util.Log
import android.view.ViewGroup
import com.facebook.react.ReactHost
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.RequestHandler
import expo.modules.devmenu.AppInfo
import expo.modules.devmenu.AppInfoProvider
import expo.modules.devmenu.DevMenuDefaultPreferences
import expo.modules.devmenu.DevMenuFragment
import expo.modules.devmenu.DevMenuPreferences
import expo.modules.devmenu.DevMenuSettings
import expo.modules.devmenu.GoHomeAction
import expo.modules.devmenu.helpers.getPrivateDeclaredFieldValue
import expo.modules.devmenu.helpers.setPrivateDeclaredFieldValue
import expo.modules.devmenu.react.DevMenuShakeDetectorListenerSwapper
import expo.modules.devmenu.websockets.DevMenuCommandHandlersProvider
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

object DevMenuApi {
  fun fragment(
    activityProvider: () -> Activity?
  ) = FragmentDelegate(
    activityProvider,
    mapper = { it }
  )

  fun model(
    activityProvider: () -> Activity?
  ) = FragmentDelegate(
    activityProvider,
    mapper = { it.viewModel }
  )

  fun configure(
    performanceMonitorNeedsOverlayPermission: Boolean = true
  ) {
    DevMenuSettings.performanceMonitorNeedsOverlayPermission = performanceMonitorNeedsOverlayPermission
  }

  fun createFragmentHost(
    activity: Activity,
    reactHostHolder: WeakReference<ReactHost>,
    preferences: DevMenuPreferences = DevMenuDefaultPreferences(activity.application),
    goToHomeAction: GoHomeAction? = null,
    reloadAction: (() -> Unit)? = null,
    appInfoProvider: AppInfoProvider = { application, reactHost -> AppInfo.getAppInfo(application, reactHost) }
  ): ViewGroup {
    return DevMenuFragment.createFragmentHost(
      activity,
      reactHostHolder,
      preferences,
      goToHomeAction,
      reloadAction,
      appInfoProvider
    )
  }

  fun installWebSocketHandlers(devSupportManager: DevSupportManager) {
    if (devSupportManager !is DevSupportManagerBase) {
      Log.w("DevMenu", "DevSupportManager is not an instance of DevSupportManagerBase. Skipping installation of custom websocket handlers.")
      return
    }

    val currentCommandHandlers =
      DevSupportManagerBase::class.java.getPrivateDeclaredFieldValue<_, Map<String, RequestHandler>?>(
        "customPackagerCommandHandlers",
        devSupportManager
      ) ?: emptyMap()

    val weakDevSupportManager = devSupportManager.weak()
    val handlers = DevMenuCommandHandlersProvider(weakDevSupportManager)
      .createCommandHandlers()

    val newCommandHandlers = currentCommandHandlers + handlers

    DevSupportManagerBase::class.java.setPrivateDeclaredFieldValue(
      "customPackagerCommandHandlers",
      devSupportManager,
      newCommandHandlers
    )
  }

  fun uninstallDefaultShakeDetector(devSupportManager: DevSupportManager) {
    if (devSupportManager !is DevSupportManagerBase) {
      Log.w("DevMenu", "DevSupportManager is not an instance of DevSupportManagerBase. Skipping uninstallation of the default shake detector.")
      return
    }

    DevMenuShakeDetectorListenerSwapper()
      .swapShakeDetectorListener(
        devSupportManager,
        newListener = {}
      )
  }
}
