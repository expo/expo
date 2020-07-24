package expo.modules.imagepicker.exporters

import android.net.Uri
import java.io.ByteArrayOutputStream
import java.io.File

/**
 * Base interface of image exporters using by {@link ImageResultTask}.
 */
@FunctionalInterface
interface ImageExporter {
  /**
   * Save `source` to the `output` file and after that it calls the listener.
   */
  fun export(source: Uri, output: File, exporterListener: Listener)

  interface Listener {
    fun onResult(out: ByteArrayOutputStream?, width: Int, height: Int)
    fun onFailure(cause: Throwable?)
  }
}
