package expo.modules.print;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentAdapterLayoutCallback;
import android.print.PrintDocumentAdapterWriteCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.io.IOException;
import java.util.Map;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.services.UIManager;

public class PrintPDFRenderTask {
  private static final int PIXELS_PER_INCH = 72;
  private static final double MILS_PER_INCH = 1000.0;
  private static final double PIXELS_PER_MIL = PIXELS_PER_INCH / MILS_PER_INCH;

  private static final int DEFAULT_MEDIA_WIDTH = 612;
  private static final int DEFAULT_MEDIA_HEIGHT = 792;

  private Context mContext;
  private ModuleRegistry mModuleRegistry;
  private Map<String, Object> mOptions;
  private File mOutputFile;
  private Callbacks mCallbacks;
  private WebView mWebView;
  private PrintAttributes mPrintAttributes;
  private ParcelFileDescriptor mFileDescriptor;
  private PrintDocumentAdapter mDocument;
  private int mNumberOfPages;

  public PrintPDFRenderTask(Context context, Map<String, Object> options, ModuleRegistry moduleRegistry) {
    mContext = context;
    mOptions = options;
    mModuleRegistry = moduleRegistry;
  }

  public void render(String filePath, Callbacks callbacks) {
    mCallbacks = callbacks;

    if (filePath != null) {
      try {
        mOutputFile = new File(filePath);
        mOutputFile.createNewFile();
        mFileDescriptor = ParcelFileDescriptor.open(mOutputFile, ParcelFileDescriptor.MODE_TRUNCATE | ParcelFileDescriptor.MODE_WRITE_ONLY);
      } catch (IOException e) {
        mCallbacks.onRenderError("E_FILE_NOT_FOUND", "Cannot create or open a file.", e);
        return;
      }
    }

    mModuleRegistry.getModule(UIManager.class).runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        String html = mOptions.containsKey("html") ? (String)mOptions.get("html") : "";

        mPrintAttributes = getPrintAttributes();
        mWebView = new WebView(mContext);

        WebSettings settings = mWebView.getSettings();
        settings.setDefaultTextEncodingName("UTF-8");

        mWebView.setWebViewClient(mWebViewClient);
        mWebView.loadDataWithBaseURL(null, html, "text/html; charset=utf-8", "UTF-8", null);
      }
    });
  }

  private PrintAttributes getPrintAttributes() {
    PrintAttributes.Builder builder = new PrintAttributes.Builder();

    if (mOptions.containsKey("html")) {
      int width = DEFAULT_MEDIA_WIDTH;
      int height = DEFAULT_MEDIA_HEIGHT;

      if (mOptions.containsKey("width") && mOptions.get("width") != null) {
        width = ((Number) mOptions.get("width")).intValue();
      }
      if (mOptions.containsKey("height") && mOptions.get("height") != null) {
        height = ((Number) mOptions.get("height")).intValue();
      }

      PrintAttributes.MediaSize mediaSize = new PrintAttributes.MediaSize(
          "id",
          "label",
          (int) Math.round(width / PIXELS_PER_MIL),
          (int) Math.round(height / PIXELS_PER_MIL)
      );

      if (mOptions.containsKey("orientation") && "landscape".equals(mOptions.get("orientation"))) {
        mediaSize = mediaSize.asLandscape();
      }

      builder
          .setMediaSize(mediaSize)
          .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
          .setResolution(new PrintAttributes.Resolution("id", "label", PIXELS_PER_INCH, PIXELS_PER_INCH));
    }

    return builder.build();
  }

  private WebViewClient mWebViewClient = new WebViewClient() {
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
      return false;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
      mDocument = mWebView.createPrintDocumentAdapter("Document");

      // layout the document with appropriate print attributes
      mDocument.onLayout(null, mPrintAttributes, null, new PrintDocumentAdapterLayoutCallback() {}, null);

      @SuppressLint("Range")
      double pageHeight = PIXELS_PER_MIL * mPrintAttributes.getMediaSize().getHeightMils();
      mNumberOfPages = 1 + (int)(mWebView.getContentHeight() / pageHeight);

      // Write to a file if file path was passed, otherwise invoke onRenderFinish callback
      if (mFileDescriptor != null) {
        mDocument.onWrite(new PageRange[]{PageRange.ALL_PAGES}, mFileDescriptor, null, mPrintDocumentWriteCallback);
      } else {
        mCallbacks.onRenderFinished(mDocument, null, mNumberOfPages);
      }
    }
  };

  private PrintDocumentAdapterWriteCallback mPrintDocumentWriteCallback = new PrintDocumentAdapterWriteCallback() {
    @Override
    public void onWriteFinished(PageRange[] pages) {
      // document and output file are now ready to finish
      mCallbacks.onRenderFinished(mDocument, mOutputFile, mNumberOfPages);
    }

    @Override
    public void onWriteFailed(CharSequence error) {
      mCallbacks.onRenderError("E_PRINT_FAILED", "An error occurred while writing PDF data.", null);
    }
  };

  public static abstract class Callbacks {
    public void onRenderFinished(PrintDocumentAdapter document, File outputFile, int numberOfPages) {
      /* do nothing - stub */
    }

    public void onRenderError(String errorCode, String errorMessage, Exception exception) {
      /* do nothing - stub */
    }
  }
}
