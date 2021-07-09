package expo.modules.print

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentAdapter.WriteResultCallback
import android.print.PrintDocumentInfo
import android.print.PrintManager
import android.util.Base64
import android.webkit.URLUtil
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.ExpoMethod
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.RandomAccessFile
import java.net.URL

class PrintModule(context: Context) : ExportedModule(context) {
  private val ORIENTATION_PORTRAIT = "portrait"
  private val ORIENTATION_LANDSCAPE = "landscape"
  private val jobName = "Printing"
  private lateinit var moduleRegistry: ModuleRegistry

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }

  override fun getName(): String {
    return "ExponentPrint"
  }

  override fun getConstants(): MutableMap<String, Any?> {
    return hashMapOf("Orientation" to hashMapOf(
      "portrait" to ORIENTATION_PORTRAIT,
      "landscape" to ORIENTATION_LANDSCAPE
    ))
  }

  @ExpoMethod
  fun print(options: Map<String?, Any?>, promise: Promise) {
    val html = if (options.containsKey("html")) {
      options["html"] as String?
    } else {
      null
    }
    val uri = if (options.containsKey("uri")) {
      options["uri"] as String?
    } else {
      null
    }
    if (html != null) {
      // Renders HTML to PDF and then prints
      try {
        val renderTask = PrintPDFRenderTask(context, options, moduleRegistry)
        renderTask.render(null, object : PrintPDFRenderTask.Callbacks() {
          override fun onRenderFinished(document: PrintDocumentAdapter, outputFile: File?, numberOfPages: Int) {
            printDocumentToPrinter(document, options)
            promise.resolve(null)
          }

          override fun onRenderError(errorCode: String?, errorMessage: String?, exception: Exception?) {
            promise.reject(errorCode, errorMessage, exception)
          }
        })
      } catch (e: Exception) {
        promise.reject("E_CANNOT_PRINT", "There was an error while trying to print HTML.", e)
      }
    } else {
      // Prints from given URI (file path or base64 data URI starting with `data:*;base64,`)
      try {
        val pda: PrintDocumentAdapter = object : PrintDocumentAdapter() {
          override fun onWrite(pages: Array<PageRange>, destination: ParcelFileDescriptor, cancellationSignal: CancellationSignal, callback: WriteResultCallback) {
            if (uri == null) {
              promise.reject("E_INVALID_URI", "Given URI is null.")
              return
            }
            val isUrl = URLUtil.isValidUrl(uri)
            if (isUrl) {
              Thread(Runnable {
                try {
                  val inputStream = if (URLUtil.isContentUrl(uri)) {
                    // URI starting with content://
                    context.contentResolver.openInputStream(Uri.parse(uri))
                  } else {
                    // other URIs, like file://
                    URL(uri).openStream()
                  }
                  inputStream?.use {
                    copyToOutputStream(destination, callback, it)
                  }
                } catch (e: Exception) {
                  e.printStackTrace()
                  promise.reject("E_CANNOT_LOAD", "An error occurred while trying to load a file at given URI.", e)
                }
              }).start()
            } else if (uri.startsWith("data:") && uri.contains(";base64,")) {
              try {
                decodeDataURI(uri).use {
                  copyToOutputStream(destination, callback, it)
                }
              } catch (e: IOException) {
                promise.reject("E_CANNOT_LOAD", "An error occurred while trying to load given data URI.", e)
              }
            } else {
              promise.reject("E_INVALID_URI", "Given URI is not valid.")
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
        }
        printDocumentToPrinter(pda, options)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("E_CANNOT_PRINT", "There was an error while trying to print a file.", e)
      }
    }
  }

  @ExpoMethod
  fun printToFileAsync(options: Map<String?, Any?>, promise: Promise) {
    val filePath: String
    try {
      filePath = generateFilePath()
    } catch (e: IOException) {
      promise.reject("E_PRINT_FAILED", "An unknown I/O exception occurred.", e)
      return
    }
    val renderTask = PrintPDFRenderTask(context, options, moduleRegistry)
    renderTask.render(filePath, object : PrintPDFRenderTask.Callbacks() {
      override fun onRenderFinished(document: PrintDocumentAdapter, outputFile: File?, numberOfPages: Int) {
        val uri = FileUtils.uriFromFile(outputFile).toString()
        var base64: String? = null
        if (options.containsKey("base64") && (options["base64"] as Boolean? == true)) {
          try {
            base64 = outputFile?.let { encodeFromFile(it) }
          } catch (e: IOException) {
            promise.reject("E_PRINT_BASE64_FAILED", "An error occurred while encoding PDF file to base64 string.", e)
            return
          }
        }
        promise.resolve(Bundle().apply {
          putString("uri", uri)
          putInt("numberOfPages", numberOfPages)
          if (base64 != null) putString("base64", base64)
        })
      }

      override fun onRenderError(errorCode: String?, errorMessage: String?, exception: Exception?) {
        promise.reject(errorCode, errorMessage, exception)
      }
    })
  }

  private fun printDocumentToPrinter(document: PrintDocumentAdapter, options: Map<String?, Any?>) {
    val printManager = moduleRegistry
      .getModule(ActivityProvider::class.java)
      .currentActivity
      ?.getSystemService(Context.PRINT_SERVICE) as? PrintManager
    val attributes = getAttributesFromOptions(options)
    printManager?.print(jobName, document, attributes.build())
  }

  private fun getAttributesFromOptions(options: Map<String?, Any?>): PrintAttributes.Builder {
    val orientation = if (options.containsKey("orientation")) {
      options["orientation"] as String?
    } else {
      null
    }
    val builder = PrintAttributes.Builder()

    // @tsapeta: Unfortunately these attributes might be ignored on some devices or Android versions,
    // in other words it might not change the default orientation in the print dialog,
    // however the user can change it there.
    if (ORIENTATION_LANDSCAPE == orientation) {
      builder.setMediaSize(PrintAttributes.MediaSize.UNKNOWN_LANDSCAPE)
    } else {
      builder.setMediaSize(PrintAttributes.MediaSize.UNKNOWN_PORTRAIT)
    }

    // @tsapeta: It should just copy the document without adding extra margins,
    // document's margins can be controlled by @page block in CSS.
    builder.setMinMargins(PrintAttributes.Margins.NO_MARGINS)
    return builder
  }

  @Throws(IOException::class)
  private fun generateFilePath(): String {
    return FileUtils.generateOutputPath(context.cacheDir, "Print", ".pdf")
  }

  @Throws(IOException::class)
  private fun encodeFromFile(file: File): String {
    val randomAccessFile = RandomAccessFile(file, "r")
    val fileBytes = ByteArray(randomAccessFile.length().toInt())
    randomAccessFile.readFully(fileBytes)
    return Base64.encodeToString(fileBytes, Base64.NO_WRAP)
  }

  private fun decodeDataURI(uri: String): InputStream {
    val base64Index = uri.indexOf(";base64,")
    val plainBase64 = uri.substring(base64Index + 8)
    val byteArray = Base64.decode(plainBase64, Base64.DEFAULT)
    return ByteArrayInputStream(byteArray)
  }

  @Throws(IOException::class)
  private fun copyToOutputStream(destination: ParcelFileDescriptor, callback: WriteResultCallback, input: InputStream) {
    FileOutputStream(destination.fileDescriptor).use {
      val buf = ByteArray(1024)
      do {
        val bytesRead = input.read(buf)
        it.write(buf, 0, bytesRead)
      } while (bytesRead > 0)
      callback.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
    }
  }
}
