package abi28_0_0.host.exp.exponent.modules.api.print;

import android.annotation.SuppressLint;
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

import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.UiThreadUtil;

import java.io.File;
import java.io.IOException;

import host.exp.exponent.utils.ScopedContext;

public class PrintPDFRenderTask {
  private static final int PIXELS_PER_INCH = 72;
  private static final double MILS_PER_INCH = 1000.0;
  private static final double PIXELS_PER_MIL = PIXELS_PER_INCH / MILS_PER_INCH;

  private static final int DEFAULT_MEDIA_WIDTH = 612;
  private static final int DEFAULT_MEDIA_HEIGHT = 792;

  private ScopedContext mScopedContext;
  private ReadableMap mOptions;
  private File mOutputFile;
  private Callbacks mCallbacks;
  private WebView mWebView;
  private PrintAttributes mPrintAttributes;
  private ParcelFileDescriptor mFileDescriptor;
  private PrintDocumentAdapter mDocument;
  private int mNumberOfPages;

  public PrintPDFRenderTask(ScopedContext scopedContext, ReadableMap options) {
    mScopedContext = scopedContext;
    mOptions = options;
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

    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        String html = mOptions.hasKey("html") ? mOptions.getString("html") : "";

        mPrintAttributes = getPrintAttributes();
        mWebView = new WebView(mScopedContext);

        WebSettings settings = mWebView.getSettings();
        settings.setDefaultTextEncodingName("UTF-8");

        mWebView.setWebViewClient(mWebViewClient);
        mWebView.loadDataWithBaseURL(null, html, "text/html; charset=utf-8", "UTF-8", null);
      }
    });
  }

  private PrintAttributes getPrintAttributes() {
    PrintAttributes.Builder builder = new PrintAttributes.Builder();

    if (mOptions.hasKey("html")) {
      int width = DEFAULT_MEDIA_WIDTH;
      int height = DEFAULT_MEDIA_HEIGHT;

      if (mOptions.hasKey("width")) {
        width = mOptions.getInt("width");
      }
      if (mOptions.hasKey("height")) {
        height = mOptions.getInt("height");
      }

      PrintAttributes.MediaSize mediaSize = new PrintAttributes.MediaSize(
          "id",
          "label",
          (int) Math.round(width / PIXELS_PER_MIL),
          (int) Math.round(height / PIXELS_PER_MIL)
      );

      if (mOptions.hasKey("orientation") && "landscape".equals(mOptions.getString("orientation"))) {
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
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        mDocument = mWebView.createPrintDocumentAdapter("Document");
      } else {
        mDocument = mWebView.createPrintDocumentAdapter();
      }

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
