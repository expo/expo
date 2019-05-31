package expo.modules.camera2.hardware.orientation

import android.content.Context
import android.view.OrientationEventListener

/**
 * Wrapper around [OrientationEventListener] to notify when the device's rotation has changed.
 */
internal open class RotationListener(
  context: Context
) : OrientationEventListener(context) {

  lateinit var orientationChanged: (DeviceRotationDegrees) -> Unit

  override fun onOrientationChanged(orientation: DeviceRotationDegrees) {
    if (canDetectOrientation()) {
      orientationChanged(orientation)
    }
  }
}
