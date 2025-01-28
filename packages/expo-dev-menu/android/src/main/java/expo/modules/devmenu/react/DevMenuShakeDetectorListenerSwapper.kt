package expo.modules.devmenu.react

import android.util.Log
import com.facebook.react.common.ShakeDetector
import com.facebook.react.devsupport.DevSupportManagerBase
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devmenu.helpers.getPrivateDeclaredFieldValue
import expo.modules.devmenu.helpers.hasDeclaredField
import expo.modules.devmenu.helpers.setPrivateDeclaredFieldValue

class DevMenuShakeDetectorListenerSwapper {
  fun swapShakeDetectorListener(
    reactHost: ReactHostWrapper,
    newListener: ShakeDetector.ShakeListener
  ) {
    try {
      val devSupportManager = requireNotNull(reactHost.devSupportManager)

      // We don't want to add handlers into `ReleaseDevSupportManager` or other custom classes
      if (devSupportManager !is DevSupportManagerBase) {
        return
      }

      val shakeDetector: ShakeDetector =
        DevSupportManagerBase::class.java.getPrivateDeclaredFieldValue(
          "mShakeDetector",
          devSupportManager
        )

      if (ShakeDetector::class.java.hasDeclaredField("shakeListener")) {
        ShakeDetector::class.java.setPrivateDeclaredFieldValue(
          "shakeListener",
          shakeDetector,
          newListener
        )
      } else {
        ShakeDetector::class.java.setPrivateDeclaredFieldValue(
          "mShakeListener",
          shakeDetector,
          newListener
        )
      }
    } catch (e: Exception) {
      Log.w("DevMenu", "Couldn't swap shake detector listener: ${e.message}", e)
    }
  }
}
