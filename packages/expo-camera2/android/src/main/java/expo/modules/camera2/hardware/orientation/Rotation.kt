package expo.modules.camera2.hardware.orientation

typealias DeviceRotationDegrees = Int

/**
 * @return closest right angle to given value. That is: 0, 90, 180, 270.
 */
internal fun Int.toClosestRightAngle(): Int {
  val roundUp = this % 90 > 45

  val roundAppModifier = if (roundUp) 1 else 0

  return (this / 90 + roundAppModifier) * 90 % 360
}
