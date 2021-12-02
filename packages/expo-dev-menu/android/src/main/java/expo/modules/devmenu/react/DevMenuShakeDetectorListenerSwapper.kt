package expo.modules.devmenu.react

import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.common.ShakeDetector
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.devmenu.helpers.getPrivateDeclaredFiledValue
import expo.modules.devmenu.helpers.setPrivateDeclaredFiledValue

class DevMenuShakeDetectorListenerSwapper {
  fun swapShakeDetectorListener(
    reactInstanceManager: ReactInstanceManager,
    newListener: ShakeDetector.ShakeListener,
  ) {
    try {
      val devSupportManager: DevSupportManager =
        ReactInstanceManager::class.java.getPrivateDeclaredFiledValue(
          "mDevSupportManager",
          reactInstanceManager
        )

      // We don't want to add handlers into `DisabledDevSupportManager` or other custom classes
      if (devSupportManager !is DevSupportManagerBase) {
        return
      }

      val shakeDetector: ShakeDetector =
        DevSupportManagerBase::class.java.getPrivateDeclaredFiledValue(
          "mShakeDetector",
          devSupportManager
        )

      ShakeDetector::class.java.setPrivateDeclaredFiledValue(
        "mShakeListener",
        shakeDetector,
        newListener
      )
    } catch (e: Exception) {
      Log.w("DevMenu", "Couldn't swap shake detector listener: ${e.message}", e)
    }
  }
}
