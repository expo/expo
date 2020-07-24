package expo.modules.imagepicker.tasks

import android.content.ContentResolver
import android.net.Uri
import expo.modules.imagepicker.exporters.CropImageExporter
import org.unimodules.core.Promise
import java.io.File

class CropResultTask(promise: Promise,
                     private val croppedUri: Uri,
                     contentResolver: ContentResolver,
                     cacheDir: File,
                     exifData: Boolean,
                     imageExporter: CropImageExporter) : ImageResultTask(promise, croppedUri, contentResolver, cacheDir, exifData, "", imageExporter) {

  override val outputFile: File
    get() = File(croppedUri.path!!)
}
