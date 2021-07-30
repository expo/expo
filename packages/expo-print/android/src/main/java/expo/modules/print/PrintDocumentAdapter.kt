package expo.modules.print

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.webkit.URLUtil
import expo.modules.core.Promise
import java.io.IOException
import java.net.URL

class PrintDocumentAdapter(val context: Context, val promise: Promise, private val uri: String?) : PrintDocumentAdapter() {
  private val jobName = "Printing"

  override fun onWrite(pages: Array<PageRange>, destination: ParcelFileDescriptor, cancellationSignal: CancellationSignal, callback: WriteResultCallback) {
    if (uri == null) {
      printFailed(callback, "E_INVALID_URI", "Given URI is null.", promise)
      return
    }
    val isUrl = URLUtil.isValidUrl(uri)
    if (isUrl) {
      Thread {
        try {
          val inputStream = if (URLUtil.isContentUrl(uri)) {
            // URI starting with content://
            context.contentResolver.openInputStream(Uri.parse(uri))
          } else {
            // other URIs, like file://
            URL(uri).openStream()
          }
          inputStream?.use {
            FileUtils.copyToOutputStream(destination, callback, it)
          }
        } catch (e: Exception) {
          e.printStackTrace()
          printFailed(callback, "E_CANNOT_LOAD", e.message, promise)
        }
      }.start()
    } else if (uri.startsWith("data:") && uri.contains(";base64,")) {
      try {
        FileUtils.decodeDataURI(uri).use {
          FileUtils.copyToOutputStream(destination, callback, it)
        }
      } catch (e: IOException) {
        printFailed(callback, "E_CANNOT_LOAD", "An error occurred while trying to load given data URI.", promise)
      }
    } else {
      printFailed(callback, "E_INVALID_URI", "Given URI is not valid.", promise)
    }
  }

  override fun onLayout(oldAttributes: PrintAttributes, newAttributes: PrintAttributes, cancellationSignal: CancellationSignal, callback: LayoutResultCallback, extras: Bundle) {
    if (cancellationSignal.isCanceled) {
      callback.onLayoutCancelled()
      return
    }
    val pdi = PrintDocumentInfo.Builder(jobName).setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).build()
    callback.onLayoutFinished(pdi, true)
  }

  private fun printFailed(callback: WriteResultCallback, code: String, error: CharSequence?, promise: Promise) {
    callback.onWriteFailed(error)
    promise.reject(code, error as String)
  }
}
