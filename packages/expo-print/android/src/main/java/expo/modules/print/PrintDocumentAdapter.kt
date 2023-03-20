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
import java.io.IOException
import java.lang.ref.WeakReference
import java.net.URL
import kotlin.coroutines.Continuation
import kotlin.coroutines.resumeWithException

class PrintDocumentAdapter(private val context: WeakReference<Context>, private val continuation: Continuation<Unit>, private val uri: String?) : PrintDocumentAdapter() {
  private val jobName = "Printing"

  override fun onWrite(pages: Array<PageRange>, destination: ParcelFileDescriptor, cancellationSignal: CancellationSignal, callback: WriteResultCallback) {
    if (uri == null) {
      printFailed(callback, NullUriException(), continuation)
      return
    }
    val isUrl = URLUtil.isValidUrl(uri)
    if (isUrl) {
      Thread {
        try {
          val inputStream = if (URLUtil.isContentUrl(uri)) {
            // URI starting with content://
            context.get()?.contentResolver?.openInputStream(Uri.parse(uri))
          } else {
            // other URIs, like file://
            URL(uri).openStream()
          }
          inputStream?.use {
            FileUtils.copyToOutputStream(destination, callback, it)
          }
        } catch (e: Exception) {
          e.printStackTrace()
          printFailed(callback, CannotLoadUriException(uri, e), continuation)
        }
      }.start()
    } else if (uri.startsWith("data:") && uri.contains(";base64,")) {
      try {
        FileUtils.decodeDataURI(uri).use {
          FileUtils.copyToOutputStream(destination, callback, it)
        }
      } catch (e: IOException) {
        printFailed(callback, CannotLoadUriException(uri, e), continuation)
      }
    } else {
      printFailed(callback, InvalidUriException(), continuation)
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

  private fun printFailed(callback: WriteResultCallback, exception: Throwable, continuation: Continuation<Unit>) {
    continuation.resumeWithException(exception)
    callback.onWriteFailed(exception.localizedMessage)
  }
}
