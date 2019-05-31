package expo.modules.camera2.hardware.orientation

import android.content.Context

import expo.modules.camera2.hardware.Display
import expo.modules.camera2.hardware.orientation.Orientation.Vertical.Portrait

/**
 * Monitors orientation of the device.
 * Notifies about orientation change.
 */
class OrientationSensor(
  context: Context,
  display: Display
) {
  private val rotationListener = RotationListener(context = context)
  private val onOrientationChanged: (DeviceRotationDegrees) -> Unit = { deviceRotation ->
    deviceRotation.toClosestRightAngle()
      .toOrientation()
      .takeIf { it != lastKnownDeviceOrientation }
      ?.let {
        val state = OrientationState(
          deviceOrientation = it,
          screenOrientation = display.getScreenOrientation()
        )

        lastKnownDeviceOrientation = state.deviceOrientation
        listener(state)
      }
  }
  private var lastKnownDeviceOrientation: Orientation = Portrait
  private lateinit var listener: (OrientationState) -> Unit

  init {
    rotationListener.orientationChanged = onOrientationChanged
  }

  /**
   * Starts monitoring device's orientation state.
   */
  fun start(listener: (OrientationState) -> Unit) {
    this.listener = listener
    rotationListener.enable()
  }

  /**
   * Stops monitoring device's orientation.
   */
  fun stop() {
    rotationListener.disable()
  }
}
