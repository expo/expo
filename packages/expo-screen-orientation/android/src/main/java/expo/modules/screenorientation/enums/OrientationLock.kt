package expo.modules.screenorientation.enums

import expo.modules.core.errors.InvalidArgumentException
import expo.modules.kotlin.types.Enumerable

enum class OrientationLock(val value: Int) : Enumerable {
  Unspecified(0),
  FullSensor(1),
  SensorPortrait(2),
  Portrait(3),
  ReversePortrait(4),
  SensorLandscape(5),
  ReverseLandscape(6),
  Landscape(7),
  Other(8),

  // Not used for anything in the native code, but it should be possible to assign an "Unknown" value to OrientationLock
  // https://docs.expo.dev/versions/latest/sdk/screen-orientation/#unknown-1
  Unknown(9);

  @Throws(InvalidArgumentException::class)
  internal fun toOrientationAttr() = try {
    OrientationAttr.values().first { it.name == this@OrientationLock.name }
  } catch (e: NoSuchElementException) {
    throw InvalidArgumentException("OrientationLock ${this@OrientationLock} is not mappable to a native Android orientation attr")
  }

  @Throws(InvalidArgumentException::class)
  internal fun toPlatformInt() = toOrientationAttr().value

  companion object {
    @Throws(InvalidArgumentException::class)
    fun fromPlatformInt(value: Int) = OrientationAttr.fromInt(value).toOrientationLock()

    // Other and Unknown can be assigned but are not valid orientation locks
    fun supportsOrientationLock(value: Int): Boolean =
      OrientationLock.values().any { it.value == value } && value != Other.value && value != Unknown.value
  }
}
