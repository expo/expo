package expo.modules.camera2.settings

import android.hardware.camera2.CameraCharacteristics

import java.util.Arrays

/**
 * White balance indicates white balance mode to be used.
 *
 * @see android.hardware.camera2.CameraCharacteristics.CONTROL_AWB_AVAILABLE_MODES
 */
enum class WhiteBalance constructor(private val mInternalMode: Int) : Option {

  /**
   * No automatic white balance.
   */
  OFF(CameraCharacteristics.CONTROL_AWB_MODE_OFF),

  /**
   * Automatic white balance selection.
   */
  AUTO(CameraCharacteristics.CONTROL_AWB_MODE_AUTO),

  /**
   * White balance appropriate for incandescent light.
   */
  INCANDESCENT(CameraCharacteristics.CONTROL_AWB_MODE_INCANDESCENT),

  /**
   * White balance appropriate for fluorescent light.
   */
  FLUORESCENT(CameraCharacteristics.CONTROL_AWB_MODE_FLUORESCENT),

  /**
   * White balance appropriate for warn fluorescent light.
   */
  WARM_FLUORESCENT(CameraCharacteristics.CONTROL_AWB_MODE_WARM_FLUORESCENT),

  /**
   * White balance appropriate for daylight captures.
   */
  DAYLIGHT(CameraCharacteristics.CONTROL_AWB_MODE_DAYLIGHT),

  /**
   * White balance appropriate for pictures in cloudy conditions.
   */
  CLOUDY(CameraCharacteristics.CONTROL_AWB_MODE_CLOUDY_DAYLIGHT),

  /**
   * White balance appropriate for pictures taken in shadow.
   */
  SHADOW(CameraCharacteristics.CONTROL_AWB_MODE_SHADE),

  /**
   * White balance appropriate for pictures illuminated by the light of he moon.
   */
  TWILIGHT(CameraCharacteristics.CONTROL_AWB_MODE_CLOUDY_DAYLIGHT);


  companion object {

    var DEFAULT = OFF

    @Throws(InvalidOptionException::class)
    internal fun fromValue(value: String): WhiteBalance {
      val list = WhiteBalance.values()
      for (item in list) {
        if (item.name.toLowerCase() == value) {
          return item
        }
      }

      throw InvalidOptionException("Invalid white balance mode provided: '" + value + "'. Available modes are: " + Arrays.toString(values()) + ".")
    }
  }
}
