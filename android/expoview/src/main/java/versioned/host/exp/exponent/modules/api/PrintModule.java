package versioned.host.exp.exponent.modules.api;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URL;

import host.exp.expoview.Exponent;

public class PrintModule extends ReactContextBaseJavaModule {

  private ReactApplicationContext mReactContext;
  private final String mJobName = "Printing";

  public PrintModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mReactContext = reactContext;
  }

  @Override
  public String getName() {
    return "ExponentPrint";
  }

  private WebView mWebView;

  @ReactMethod
  public void print(final ReadableMap options, final Promise promise) {

    final String html = options.hasKey("html") ? options.getString("html") : null;
    final String uri = options.hasKey("uri") ? options.getString("uri") : null;

    if (html != null) {
      try {
        UiThreadUtil.runOnUiThread(new Runnable() {
          @Override
          public void run() {
            WebView webView = new WebView(mReactContext);
            webView.setWebViewClient(new WebViewClient() {
              public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
              }

              @Override
              public void onPageFinished(WebView view, String url) {
                PrintManager printManager = (PrintManager) Exponent.getInstance().getCurrentActivity().getSystemService(
                    Context.PRINT_SERVICE);
                PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
                  private final PrintDocumentAdapter mWrappedInstance =
                      mWebView.createPrintDocumentAdapter();
                  @Override
                  public void onStart() {
                    mWrappedInstance.onStart();
                  }
                  @Override
                  public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                                       CancellationSignal cancellationSignal, LayoutResultCallback callback,
                                       Bundle extras) {
                    mWrappedInstance.onLayout(oldAttributes, newAttributes, cancellationSignal,
                        callback, extras);
                  }
                  @Override
                  public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                                      CancellationSignal cancellationSignal, WriteResultCallback callback) {
                    mWrappedInstance.onWrite(pages, destination, cancellationSignal, callback);
                  }
                  @Override
                  public void onFinish() {
                    mWrappedInstance.onFinish();
                  }
                };
                // Pass in the ViewView's document adapter.
                printManager.print(mJobName, adapter, null);
                mWebView = null;
                promise.resolve(null);
              }
            });

            webView.loadDataWithBaseURL(null, html, "text/HTML", "UTF-8", null);

            mWebView = webView;
          }
        });
      } catch (Exception e) {
        promise.reject("E_CANNOT_PRINT", "There was an error while trying to print HTML.", e);
      }
    } else {

      try {

        PrintManager printManager = (PrintManager) Exponent.getInstance().getCurrentActivity().getSystemService(Context.PRINT_SERVICE);
        PrintDocumentAdapter pda = new PrintDocumentAdapter() {

          @Override
          public void onWrite(PageRange[] pages, final ParcelFileDescriptor destination, CancellationSignal cancellationSignal, final WriteResultCallback callback){
            try {
              boolean isUrl = URLUtil.isValidUrl(uri);

              if (isUrl) {
                new Thread(new Runnable() {
                  public void run() {
                    try {
                      InputStream inputStream;
                      if (URLUtil.isContentUrl(uri)) {
                        inputStream = mReactContext.getContentResolver().openInputStream(Uri.parse(uri));
                      } else {
                        inputStream = new URL(uri).openStream();
                      }
                      loadAndClose(destination, callback, inputStream);
                    } catch (Exception e) {
                      e.printStackTrace();
                    }
                  }
                }).start();
              } else {
                InputStream input = new FileInputStream(uri);
                loadAndClose(destination, callback, input);
              }

            } catch (FileNotFoundException fnfe){
              promise.reject("E_INVALID_FILE", "The file was not found.");
            } catch (Exception e) {
              promise.reject("E_CANNOT_PRINT", "An error occurred while trying to print provided file.", e);
            }
          }

          @Override
          public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes, CancellationSignal cancellationSignal, LayoutResultCallback callback, Bundle extras){

            if (cancellationSignal.isCanceled()) {
              callback.onLayoutCancelled();
              return;
            }

            PrintDocumentInfo pdi = new PrintDocumentInfo.Builder(mJobName).setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).build();

            callback.onLayoutFinished(pdi, true);
          }
        };

        printManager.print(mJobName, pda, null);
        promise.resolve(null);

      } catch (Exception e) {
        promise.reject("E_CANNOT_PRINT", "There was an error while trying to print a file.", e);
      }
    }
  }


  private void loadAndClose(ParcelFileDescriptor destination, PrintDocumentAdapter.WriteResultCallback callback, InputStream input) throws IOException {
    OutputStream output = null;
    output = new FileOutputStream(destination.getFileDescriptor());

    byte[] buf = new byte[1024];
    int bytesRead;

    while ((bytesRead = input.read(buf)) > 0) {
      output.write(buf, 0, bytesRead);
    }

    callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});

    try {
      input.close();
      output.close();
    } catch (IOException e) {
      e.printStackTrace();
    }
  }
}
