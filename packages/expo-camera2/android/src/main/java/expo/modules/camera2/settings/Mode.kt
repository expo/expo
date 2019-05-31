package expo.modules.camera2.settings

import java.util.Arrays

/**
 * Autofocus indicates focus mode to be used
 */
enum class Mode private constructor(private val mMode: Int) : Option {

  PICTURE(0),
  VIDEO(1);


  companion object {

    var DEFAULT = PICTURE

    @Throws(InvalidOptionException::class)
    internal fun fromValue(value: Int): Mode {
      val list = Mode.values()
      for (mode in list) {
        if (mode.mMode == value) {
          return mode
        }
      }

      throw InvalidOptionException("Invalid mode type provided: '" + value + "'. Available modes are: " + Arrays.toString(values()) + ".")
    }
  }
}
