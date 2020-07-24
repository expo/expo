package expo.modules.imagepicker.fileproviders

import android.net.Uri
import java.io.File

class CropFileProvider(private val croppedUri: Uri) : FileProvider {
  override fun generateFile(): File {
    return File(croppedUri.path!!)
  }
}
