package expo.modules.camera2.settings

import java.util.Arrays

/**
 * Autofocus indicates focus mode to be used
 */
enum class Autofocus constructor(private val mMode: Int) : Option {

  OFF(0),
  ON(1);


  companion object {

    var DEFAULT = ON

    @Throws(InvalidOptionException::class)
    internal fun fromValue(value: Int): Autofocus {
      val list = Autofocus.values()
      for (autofocus in list) {
        if (autofocus.mMode == value) {
          return autofocus
        }
      }

      throw InvalidOptionException("Invalid autofocus mode provided: '" + value + "'. Available modes are: " + Arrays.toString(values()) + ".")
    }
  }
}
