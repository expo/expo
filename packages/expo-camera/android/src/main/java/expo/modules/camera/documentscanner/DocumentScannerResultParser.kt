package expo.modules.camera.documentscanner

import android.content.Context
import android.net.Uri
import android.os.Bundle
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import expo.modules.camera.utils.FileSystemUtils
import java.io.File
import java.io.IOException

object DocumentScannerResultParser {
  fun parse(context: Context, result: GmsDocumentScanningResult, cacheDir: File): Bundle {
    val pageUris = result.pages.orEmpty().map { page ->
      copyToCache(context, page.imageUri, cacheDir, ".jpg")
    }
    return Bundle().apply {
      putStringArray("pages", pageUris.toTypedArray())
      result.pdf?.let { pdf ->
        putString("pdfUri", copyToCache(context, pdf.uri, cacheDir, ".pdf"))
      }
    }
  }

  private fun copyToCache(context: Context, source: Uri, cacheDir: File, extension: String): String {
    val target = FileSystemUtils.generateOutputFile(cacheDir, "DocumentScanner", extension)
    val input = context.contentResolver.openInputStream(source)
      ?: throw IOException("Could not open the scanned document at $source")
    input.use { stream ->
      target.outputStream().use { output -> stream.copyTo(output) }
    }
    return Uri.fromFile(target).toString()
  }
}
