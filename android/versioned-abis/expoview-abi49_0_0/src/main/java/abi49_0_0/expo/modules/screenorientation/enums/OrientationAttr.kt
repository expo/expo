package abi49_0_0.expo.modules.screenorientation.enums

import android.content.pm.ActivityInfo
import abi49_0_0.expo.modules.core.errors.InvalidArgumentException
import abi49_0_0.expo.modules.kotlin.types.Enumerable

enum class OrientationAttr(val value: Int) : Enumerable {
  Behind(ActivityInfo.SCREEN_ORIENTATION_BEHIND),
  Landscape(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE),
  Portrait(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT),
  FullSensor(ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR),
  Unspecified(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED),
  Locked(ActivityInfo.SCREEN_ORIENTATION_LOCKED),
  FullUser(ActivityInfo.SCREEN_ORIENTATION_FULL_USER),
  NoSensor(ActivityInfo.SCREEN_ORIENTATION_NOSENSOR),
  ReverseLandscape(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE),
  ReversePortrait(ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT),
  Sensor(ActivityInfo.SCREEN_ORIENTATION_SENSOR),
  SensorPortrait(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT),
  SensorLandscape(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE),
  User(ActivityInfo.SCREEN_ORIENTATION_USER),
  UserPortrait(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT),
  UserLandscape(ActivityInfo.SCREEN_ORIENTATION_USER_LANDSCAPE);

  internal fun toOrientationLock() = try {
    OrientationLock.values().first { it.name == this@OrientationAttr.name }
  } catch (e: NoSuchElementException) {
    OrientationLock.Other
  }

  companion object {
    @Throws(InvalidArgumentException::class)
    fun fromInt(value: Int) = try {
      OrientationAttr.values().first { it.value == value }
    } catch (e: NoSuchElementException) {
      throw InvalidArgumentException("Platform orientation $value is not a valid Android orientation attr")
    }
  }
}
