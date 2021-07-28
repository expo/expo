package expo.modules.print

import android.content.Context
import android.os.Bundle
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintManager
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import java.io.File
import java.io.IOException

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
    return hashMapOf(
      "Orientation" to hashMapOf(
        "portrait" to ORIENTATION_PORTRAIT,
        "landscape" to ORIENTATION_LANDSCAPE
      )
    )
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
        renderTask.render(
          null,
          object : PrintPDFRenderTask.Callbacks() {
            override fun onRenderFinished(document: PrintDocumentAdapter, outputFile: File?, numberOfPages: Int) {
              printDocumentToPrinter(document, options)
              promise.resolve(null)
            }

            override fun onRenderError(errorCode: String?, errorMessage: String?, exception: Exception?) {
              promise.reject(errorCode, errorMessage, exception)
            }
          }
        )
      } catch (e: Exception) {
        promise.reject("E_CANNOT_PRINT", "There was an error while trying to print HTML.", e)
      }
    } else {
      // Prints from given URI (file path or base64 data URI starting with `data:*;base64,`)
      try {
        val pda = PrintDocumentAdapter(context, promise, uri)
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
      filePath = FileUtils.generateFilePath(context)
    } catch (e: IOException) {
      promise.reject("E_PRINT_FAILED", "An unknown I/O exception occurred.", e)
      return
    }
    val renderTask = PrintPDFRenderTask(context, options, moduleRegistry)
    renderTask.render(
      filePath,
      object : PrintPDFRenderTask.Callbacks() {
        override fun onRenderFinished(document: PrintDocumentAdapter, outputFile: File?, numberOfPages: Int) {
          val uri = FileUtils.uriFromFile(outputFile).toString()
          var base64: String? = null
          if (options.containsKey("base64") && (options["base64"] as Boolean? == true)) {
            try {
              base64 = outputFile?.let { FileUtils.encodeFromFile(it) }
            } catch (e: IOException) {
              promise.reject("E_PRINT_BASE64_FAILED", "An error occurred while encoding PDF file to base64 string.", e)
              return
            }
          }
          promise.resolve(
            Bundle().apply {
              putString("uri", uri)
              putInt("numberOfPages", numberOfPages)
              if (base64 != null) putString("base64", base64)
            }
          )
        }

        override fun onRenderError(errorCode: String?, errorMessage: String?, exception: Exception?) {
          promise.reject(errorCode, errorMessage, exception)
        }
      }
    )
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
}
