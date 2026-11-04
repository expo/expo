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
import android.util.Log
import android.webkit.URLUtil
import java.io.IOException
import java.lang.ref.WeakReference
import java.net.URL

private const val TAG = "ExpoPrint"

class PrintDocumentAdapter(private val context: WeakReference<Context>, private val uri: String?) : PrintDocumentAdapter() {
  private val jobName: String = uri?.let {
    Uri.parse(it).lastPathSegment ?: it
  } ?: "Printing"

  override fun onWrite(pages: Array<PageRange>, destination: ParcelFileDescriptor, cancellationSignal: CancellationSignal, callback: WriteResultCallback) {
    if (uri == null) {
      printFailed(callback, NullUriException())
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
          printFailed(callback, CannotLoadUriException(uri, e))
        }
      }.start()
    } else if (FileUtils.isBase64DataUri(uri)) {
      try {
        FileUtils.decodeDataURI(uri).use {
          FileUtils.copyToOutputStream(destination, callback, it)
        }
      } catch (e: IOException) {
        printFailed(callback, CannotLoadUriException(uri, e))
      }
    } else {
      printFailed(callback, InvalidUriException(uri))
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

  // `printAsync` already resolved when the print window opened, so it cannot reject here.
  // The print window shows the `onWriteFailed` text to the user. `null` shows the localized system message.
  private fun printFailed(callback: WriteResultCallback, exception: Throwable) {
    Log.e(TAG, exception.message, exception)
    callback.onWriteFailed(null)
  }
}
