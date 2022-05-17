package expo.modules.imagepicker.fileproviders

import java.io.File
import java.io.IOException

/**
 * Interface that allows to generate a new file to store a picked media asset as the original
 * file with the media asset might not be readable/editable by the user's application.
 */
interface FileProvider {
  /**
   * Generates a new file to store picked media asset.
   */
  fun generateFile(): File
}
