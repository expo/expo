package expo.modules.imagepicker.exporters

import android.graphics.Bitmap
import android.net.Uri
import androidx.annotation.FloatRange
import androidx.core.net.toFile
import expo.modules.imagepicker.FailedToReadFileException
import expo.modules.imagepicker.FailedToWriteFileException
import expo.modules.imagepicker.toBitmapCompressFormat
import expo.modules.kotlin.exception.ModuleNotFoundException
import expo.modules.kotlin.providers.AppContextProvider
import expo.modules.kotlin.providers.ContextProvider
import kotlinx.coroutines.runInterruptible
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.ExecutionException

class CompressionImageExporter(
  private val appContextProvider: AppContextProvider,
  private val contextProvider: ContextProvider,
  @FloatRange(from = 0.0, to = 1.0)
  private val quality: Double,
) : ImageExporter {
  private val compressQuality: Int
    get() {
      return (quality * 100).toInt()
    }

  override suspend fun exportAsync(source: Uri, output: File): ImageExportResult = runInterruptible {
    val loaderResult = appContextProvider.appContext.imageLoader
      ?.loadImageForManipulationFromURL(source.toString())
      ?: throw ModuleNotFoundException("ImageLoader")

    val bitmap = try {
      loaderResult.get()
    } catch (cause: ExecutionException) {
      throw FailedToReadFileException(source.toFile(), cause)
    }

    val compressFormat = output.toBitmapCompressFormat()
    writeImage(bitmap, output, compressFormat)

    return@runInterruptible object : ImageExportResult(
      bitmap.width,
      bitmap.height,
      contextProvider,
      output
    ) {
      override suspend fun data(): ByteArrayOutputStream {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, compressQuality, outputStream)
        return outputStream
      }
    }
  }

  /**
   * Compress and save the `bitmap` to `file`
   * @throws [IOException]
   */
  private fun writeImage(bitmap: Bitmap, output: File, compressFormat: Bitmap.CompressFormat) {
    try {
      FileOutputStream(output).use { out -> bitmap.compress(compressFormat, compressQuality, out) }
    } catch (cause: FileNotFoundException) {
      throw FailedToWriteFileException(output, cause)
    }
  }
}
