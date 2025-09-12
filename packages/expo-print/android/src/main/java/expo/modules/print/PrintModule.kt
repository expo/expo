package expo.modules.print

import android.content.Context
import android.os.ParcelFileDescriptor
import android.print.PrintAttributes
import android.print.PrintManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.print.PrintDocumentAdapter
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.lang.ref.WeakReference
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

private const val ORIENTATION_PORTRAIT = "portrait"
private const val ORIENTATION_LANDSCAPE = "landscape"

class PrintModule : Module() {
  private val jobName = "Printing"
  override fun definition() = ModuleDefinition {
    Name("ExpoPrint")

    Constant("Orientation") {
      mapOf(
        "portrait" to ORIENTATION_PORTRAIT,
        "landscape" to ORIENTATION_LANDSCAPE
      )
    }

    AsyncFunction("print") Coroutine { options: PrintOptions ->
      return@Coroutine print(options)
    }

    AsyncFunction("printToFileAsync") Coroutine { options: PrintOptions ->
      return@Coroutine printToFile(options)
    }
  }

  val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private suspend fun print(options: PrintOptions) {
    withContext(Dispatchers.Main) {
      suspendCancellableCoroutine { continuation ->
        if (options.html != null) {
          // Renders HTML to PDF and then prints
          try {
            val renderTask = PrintPDFRenderTask(context, options)
            renderTask.render(
              null,
              null,
              createPrintCallbacks(options, continuation)
            )
          } catch (e: Exception) {
            continuation.resumeWithException(UnexpectedPrintException("There was an error while trying to print HTML ", e))
          }
        } else {
          // Prints from given URI (file path or base64 data URI starting with `data:*;base64,`)
          try {
            val pda = PrintDocumentAdapter(WeakReference(context), continuation, options.uri)
            printDocumentToPrinter(pda, options)
            continuation.resume(null)
          } catch (e: Exception) {
            continuation.resumeWithException(UnexpectedPrintException("There was an error while trying to print file ", e))
          }
        }
      }
    }
  }

  private suspend fun printToFile(options: PrintOptions): FilePrintResult? {
    var filePath: String
    var fileDescriptor: ParcelFileDescriptor?
    var outputFile: File

    // Create the files on IO thread
    withContext(Dispatchers.IO) {
      try {
        filePath = FileUtils.generateFilePath(context)
      } catch (e: IOException) {
        throw UnexpectedPrintException("An unknown I/O exception occurred ", e)
      }
      try {
        outputFile = File(filePath)
        outputFile.createNewFile()
        fileDescriptor = ParcelFileDescriptor.open(outputFile, ParcelFileDescriptor.MODE_TRUNCATE or ParcelFileDescriptor.MODE_WRITE_ONLY)
      } catch (e: IOException) {
        throw FileNotFoundException(e)
      }
    }

    return withContext(Dispatchers.Main) {
      return@withContext suspendCancellableCoroutine { continuation ->
        val renderTask = PrintPDFRenderTask(context, options)
        renderTask.render(
          outputFile,
          fileDescriptor,
          createPrintToFileCallbacks(options, continuation)
        )
      }
    }
  }

  private fun createPrintToFileCallbacks(options: PrintOptions, continuation: Continuation<FilePrintResult>): PrintPDFRenderTask.Callbacks {
    return object : PrintPDFRenderTask.Callbacks() {
      override fun onRenderFinished(document: PrintDocumentAdapter, outputFile: File?, numberOfPages: Int) {
        val uri = FileUtils.uriFromFile(outputFile).toString()
        var base64: String? = null
        if (options.base64) {
          try {
            base64 = outputFile?.let { FileUtils.encodeFromFile(it) }
          } catch (e: IOException) {
            continuation.resumeWithException(Base64EncodingFailedException(e))
            return
          }
        }
        val result = FilePrintResult(uri, numberOfPages, base64)
        continuation.resume(result)
      }

      override fun onRenderError(exception: CodedException) {
        continuation.resumeWithException(exception)
      }
    }
  }

  private fun createPrintCallbacks(options: PrintOptions, continuation: Continuation<Unit>): PrintPDFRenderTask.Callbacks {
    return object : PrintPDFRenderTask.Callbacks() {
      override fun onRenderFinished(document: PrintDocumentAdapter, outputFile: File?, numberOfPages: Int) {
        printDocumentToPrinter(document, options)
        continuation.resume(Unit)
      }

      override fun onRenderError(exception: CodedException) {
        continuation.resumeWithException(exception)
      }
    }
  }

  private fun printDocumentToPrinter(document: PrintDocumentAdapter, options: PrintOptions) {
    (appContext.throwingActivity.getSystemService(Context.PRINT_SERVICE) as? PrintManager)?.let {
      val attributes = getAttributesFromOptions(options)
      it.print(jobName, document, attributes.build())
    } ?: throw PrintManagerNotAvailableException()
  }

  private fun getAttributesFromOptions(options: PrintOptions): PrintAttributes.Builder {
    val orientation = options.orientation
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
