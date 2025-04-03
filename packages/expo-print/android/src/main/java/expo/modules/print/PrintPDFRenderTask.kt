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
import androidx.annotation.UiThread
import expo.modules.kotlin.exception.CodedException
import java.io.File

import kotlin.math.roundToInt

internal class PrintPDFRenderTask(private val context: Context, private val options: PrintOptions) {
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

  @UiThread
  fun render(outputFile: File?, fileDescriptor: ParcelFileDescriptor?, callbacks: Callbacks) {
    this.callbacks = callbacks
    this.fileDescriptor = fileDescriptor
    outputFile?.let {
      this.outputFile = it
    }

    val html = options.html ?: ""
    webView = WebView(context)
    val settings = webView.settings
    settings.defaultTextEncodingName = "UTF-8"
    webView.webViewClient = webViewClient
    options.textZoom?.let { textZoom ->
      webView.settings.textZoom = textZoom
    }
    webView.loadDataWithBaseURL(null, html, "text/html; charset=utf-8", "UTF-8", null)
  }

  private val printAttributes: PrintAttributes
    get() {
      val builder = PrintAttributes.Builder()
      if (options.html != null) {
        var width = DEFAULT_MEDIA_WIDTH
        var height = DEFAULT_MEDIA_HEIGHT
        options.width?.let {
          width = it
        }

        options.height?.let {
          height = it
        }

        var mediaSize = PrintAttributes.MediaSize(
          "id",
          "label",
          (width / PIXELS_PER_MIL).roundToInt(),
          (height / PIXELS_PER_MIL).roundToInt()
        )
        options.orientation?.let {
          if (it === "landscape") {
            mediaSize = mediaSize.asLandscape()
          }
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
      @SuppressLint("Range")
      val pageHeight = PIXELS_PER_MIL * printAttributes.mediaSize!!.heightMils
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
      callbacks.onRenderError(PdfWriteException())
    }
  }

  abstract class Callbacks {
    open fun onRenderFinished(document: PrintDocumentAdapter, outputFile: File?, numberOfPages: Int) = Unit

    open fun onRenderError(exception: CodedException) = Unit
  }
}
