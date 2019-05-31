package expo.modules.camera2.settings

import java.util.Arrays

/**
 * Describes flash mode to be used
 *
 * @see android.hardware.camera2.CaptureRequest.FLASH_MODE
 */
enum class Flash private constructor(private val value: Int) : Option {

  /**
   * Flash is always off.
   */
  OFF(0),

  /**
   * Flash will be on when capturing.
   */
  ON(1),

  /**
   * Flash mode is chosen by the camera.
   */
  AUTO(2),

  /**
   * Flash is always on, working as a torch.
   */
  TORCH(3);

  internal fun value(): Int {
    return value
  }

  companion object {

    val DEFAULT = OFF

    @Throws(InvalidOptionException::class)
    internal fun fromValue(value: Int): Flash {
      val list = Flash.values()
      for (action in list) {
        if (action.value() == value) {
          return action
        }
      }
      throw InvalidOptionException("Invalid flash mode provided: '" + value + "'. Available modes are: " + Arrays.toString(values()) + ".")
    }
  }
}
