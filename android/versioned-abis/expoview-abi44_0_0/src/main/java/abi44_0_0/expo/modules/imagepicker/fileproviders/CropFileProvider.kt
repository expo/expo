package abi44_0_0.expo.modules.imagepicker.fileproviders

import android.net.Uri
import java.io.File

class CropFileProvider(private val croppedUri: Uri) : FileProvider {
  override fun generateFile() = File(croppedUri.path!!)
}
