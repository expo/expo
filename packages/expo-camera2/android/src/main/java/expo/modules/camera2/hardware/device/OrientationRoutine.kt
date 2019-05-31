package expo.modules.camera2.hardware.device

internal fun Device.startOrientationMonitoring() {
  orientationSensor.start { orientationState ->
    executor.execute {
      getSelectedCamera().setDisplayOrientation(orientationState)
    }
  }
}