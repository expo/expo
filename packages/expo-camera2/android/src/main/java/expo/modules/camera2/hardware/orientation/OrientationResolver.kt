package expo.modules.camera2.hardware.orientation

/**
 * @param screenOrientation Orientation of the display.
 * @param cameraOrientation Orientation of the camera sensor.
 * @param cameraIsMirrored `true` if camera is mirrored (typically that is the case
 * for front cameras). `false` if it is not mirrored.
 *
 * @return rotation of the image relatively to current device orientation.
 */
fun computePreviewOrientation(
        screenOrientation: Orientation,
        cameraOrientation: Orientation,
        cameraIsMirrored: Boolean
): Orientation {
  val mirroredCameraModifier = if (cameraIsMirrored) -1 else 1

  val rotation = (720
      + mirroredCameraModifier * screenOrientation.degrees
      - cameraOrientation.degrees
    ) % 360

  return rotation.toOrientation()
}

/**
 * @param deviceOrientation Orientation of the device.
 * @param cameraOrientation Orientation of the camera sensor.
 * @param cameraIsMirrored `true` if camera is mirrored (typically that is the case
 * for front cameras). `false` if it is not mirrored.
 *
 * @return clockwise rotation of the image relatively to current device orientation.
 */
internal fun computeImageOrientation(
        deviceOrientation: Orientation,
        cameraOrientation: Orientation,
        cameraIsMirrored: Boolean
): Orientation {
  val screenOrientationDegrees = deviceOrientation.degrees
  val cameraRotationDegrees = cameraOrientation.degrees

  val rotation = if (cameraIsMirrored) {
    360 - (cameraRotationDegrees - screenOrientationDegrees + 360) % 360
  } else {
    360 - (cameraRotationDegrees + screenOrientationDegrees) % 360
  }

  return rotation.toOrientation()
}

/**
 * @param screenOrientation Orientation of the display.
 * @param cameraOrientation Orientation of the camera sensor.
 * @param cameraIsMirrored `true` if camera is mirrored (typically that is the case for
 * front cameras). `false` if it is not mirrored.
 *
 * @return display orientation in which user will see the output camera in a correct rotation.
 */
internal fun computeDisplayOrientation(
        screenOrientation: Orientation,
        cameraOrientation: Orientation,
        cameraIsMirrored: Boolean
): Orientation {
  val screenOrientationDegrees = screenOrientation.degrees
  val cameraRotationDegrees = cameraOrientation.degrees

  val rotation = if (cameraIsMirrored) {
    (360 - (cameraRotationDegrees + screenOrientationDegrees) % 360) % 360
  } else {
    (cameraRotationDegrees - screenOrientationDegrees + 360) % 360
  }

  return rotation.toOrientation()
}
