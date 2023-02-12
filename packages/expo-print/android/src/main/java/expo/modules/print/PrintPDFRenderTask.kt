package expo.modules.print

import android.annotation.SuppressLint
import android.content.Context
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentAdapterLayoutCallback
import android.print.PrintDocumentAdapterWriteCallback
import android.webkit.WebView
import android.webkit.WebViewClient
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.services.UIManager
import java.io.File
import java.io.IOException
import kotlin.math.roundToInt

class PrintPDFRenderTask(private val context: Context, private val options: Map<String?, Any?>, private val moduleRegistry: ModuleRegistry) {
  private val PIXELS_PER_INCH = 72
  private val MILS_PER_INCH = 1000.0
  private val PIXELS_PER_MIL = PIXELS_PER_INCH / MILS_PER_INCH
  private val DEFAULT_MEDIA_WIDTH = 612
  private val DEFAULT_MEDIA_HEIGHT = 792
  private lateinit var outputFile: File
  private lateinit var callbacks: Callbacks
  private lateinit var webView: WebView
  private var fileDescriptor: ParcelFileDescriptor? = null
  private lateinit var document: PrintDocumentAdapter
  private var numberOfPages = 0

  fun render(filePath: String?, callbacks: Callbacks) {
    this.callbacks = callbacks
    filePath?.let {
      try {
        outputFile = File(it)
        outputFile.createNewFile()
        fileDescriptor = ParcelFileDescriptor.open(outputFile, ParcelFileDescriptor.MODE_TRUNCATE or ParcelFileDescriptor.MODE_WRITE_ONLY)
      } catch (e: IOException) {
        this.callbacks.onRenderError("E_FILE_NOT_FOUND", "Cannot create or open a file.", e)
        return
      }
    }
    moduleRegistry.getModule(UIManager::class.java).runOnUiQueueThread {
      val html = if (options.containsKey("html")) {
        options["html"] as String
      } else {
        ""
      }
      webView = WebView(context)
      val settings = webView.settings
      settings.defaultTextEncodingName = "UTF-8"
      webView.webViewClient = webViewClient
      webView.loadDataWithBaseURL(null, html, "text/html; charset=utf-8", "UTF-8", null)
    }
  }

  private val printAttributes: PrintAttributes
    get() {
      val builder = PrintAttributes.Builder()
      if (options.containsKey("html")) {
        var width = DEFAULT_MEDIA_WIDTH
        var height = DEFAULT_MEDIA_HEIGHT
        if (options.containsKey("width") && options["width"] != null) {
          width = (options["width"] as Number).toInt()
        }
        if (options.containsKey("height") && options["height"] != null) {
          height = (options["height"] as Number).toInt()
        }
        var mediaSize = PrintAttributes.MediaSize(
          "id",
          "label",
          (width / PIXELS_PER_MIL).roundToInt(),
          (height / PIXELS_PER_MIL).roundToInt()
        )
        if (options.containsKey("orientation") && "landscape" == options["orientation"]) {
          mediaSize = mediaSize.asLandscape()
        }
        builder
          .setMediaSize(mediaSize)
          .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
          .setResolution(PrintAttributes.Resolution("id", "label", PIXELS_PER_INCH, PIXELS_PER_INCH))
      }
      return builder.build()
    }

  private val webViewClient: WebViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
      return false
    }

    override fun onPageFinished(view: WebView, url: String) {
      document = view.createPrintDocumentAdapter("Document")
      // layout the document with appropriate print attributes
      document.onLayout(null, printAttributes, null, object : PrintDocumentAdapterLayoutCallback() {}, null)
      @SuppressLint("Range") val pageHeight = PIXELS_PER_MIL * printAttributes.mediaSize!!.heightMils
      numberOfPages = 1 + (view.contentHeight / pageHeight).toInt()

      // Write to a file if file path was passed, otherwise invoke onRenderFinish callback
      if (fileDescriptor != null) {
        document.onWrite(arrayOf(PageRange.ALL_PAGES), fileDescriptor, null, printDocumentWriteCallback)
      } else {
        callbacks.onRenderFinished(document, null, numberOfPages)
      }
    }
  }
  private val printDocumentWriteCallback: PrintDocumentAdapterWriteCallback = object : PrintDocumentAdapterWriteCallback() {
    override fun onWriteFinished(pages: Array<PageRange>) {
      // document and output file are now ready to finish
      callbacks.onRenderFinished(document, outputFile, numberOfPages)
    }

    override fun onWriteFailed(error: CharSequence?) {
      callbacks.onRenderError("E_PRINT_FAILED", "An error occurred while writing PDF data.", null)
    }
  }

  abstract class Callbacks {
    open fun onRenderFinished(document: PrintDocumentAdapter, outputFile: File?, numberOfPages: Int) = Unit

    open fun onRenderError(errorCode: String?, errorMessage: String?, exception: Exception?) = Unit
  }
}
