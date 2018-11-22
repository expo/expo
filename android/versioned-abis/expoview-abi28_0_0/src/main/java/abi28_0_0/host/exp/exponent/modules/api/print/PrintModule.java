package abi28_0_0.host.exp.exponent.modules.api.print;

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
import android.util.Base64;
import android.webkit.URLUtil;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.URL;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;
import host.exp.expoview.Exponent;

public class PrintModule extends ReactContextBaseJavaModule {

  private static String ORIENTATION_PORTRAIT = "portrait";
  private static String ORIENTATION_LANDSCAPE = "landscape";

  private ReactApplicationContext mReactContext;
  private ScopedContext mScopedContext;
  private final String mJobName = "Printing";

  public PrintModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mReactContext = reactContext;
    mScopedContext = scopedContext;
  }

  @Override
  public String getName() {
    return "ExponentPrint";
  }

  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("Orientation", Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("portrait", ORIENTATION_PORTRAIT);
            put("landscape", ORIENTATION_LANDSCAPE);
          }
        }));
      }
    });
  }

  @ReactMethod
  public void print(final ReadableMap options, final Promise promise) {
    final String html = options.hasKey("html") ? options.getString("html") : null;
    final String uri = options.hasKey("uri") ? options.getString("uri") : null;

    if (html != null) {
      // Renders HTML to PDF and then prints

      try {
        PrintPDFRenderTask renderTask = new PrintPDFRenderTask(mScopedContext, options);

        renderTask.render(null, new PrintPDFRenderTask.Callbacks() {
          @Override
          public void onRenderFinished(PrintDocumentAdapter document, File outputFile, int numberOfPages) {
            printDocumentToPrinter(document, options);
            promise.resolve(null);
          }

          @Override
          public void onRenderError(String errorCode, String errorMessage, Exception exception) {
            promise.reject(errorCode, errorMessage, exception);
          }
        });
      } catch (Exception e) {
        promise.reject("E_CANNOT_PRINT", "There was an error while trying to print HTML.", e);
      }
    } else {
      // Prints from given URI (file path or base64 data URI starting with `data:*;base64,`)

      try {
        PrintDocumentAdapter pda = new PrintDocumentAdapter() {
          @Override
          public void onWrite(PageRange[] pages, final ParcelFileDescriptor destination, CancellationSignal cancellationSignal, final WriteResultCallback callback){
            boolean isUrl = URLUtil.isValidUrl(uri);

            if (isUrl) {
              new Thread(new Runnable() {
                public void run() {
                  try {
                    InputStream inputStream;

                    if (URLUtil.isContentUrl(uri)) {
                      // URI starting with content://
                      inputStream = mReactContext.getContentResolver().openInputStream(Uri.parse(uri));
                    } else {
                      // other URIs, like file://
                      inputStream = new URL(uri).openStream();
                    }

                    loadAndClose(destination, callback, inputStream);
                  } catch (Exception e) {
                    e.printStackTrace();
                    promise.reject("E_CANNOT_LOAD", "An error occurred while trying to load a file at given URI.", e);
                  }
                }
              }).start();
            } else if (uri.startsWith("data:") && uri.contains(";base64,")) {
              try {
                InputStream input = decodeDataURI(uri);
                loadAndClose(destination, callback, input);
              } catch (IOException e) {
                promise.reject("E_CANNOT_LOAD", "An error occurred while trying to load given data URI.", e);
              }
            } else {
              promise.reject("E_INVALID_URI", "Given URI is not valid.");
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

        printDocumentToPrinter(pda, options);
        promise.resolve(null);

      } catch (Exception e) {
        promise.reject("E_CANNOT_PRINT", "There was an error while trying to print a file.", e);
      }
    }
  }

  @ReactMethod
  public void printToFileAsync(final ReadableMap options, final Promise promise) {
    String filePath = null;

    try {
      filePath = generateFilePath();
    } catch (IOException e) {
      promise.reject("E_PRINT_FAILED", "An unknown I/O exception occurred.", e);
    }

    PrintPDFRenderTask renderTask = new PrintPDFRenderTask(mScopedContext, options);

    renderTask.render(filePath, new PrintPDFRenderTask.Callbacks() {
      @Override
      public void onRenderFinished(PrintDocumentAdapter document, File outputFile, int numberOfPages) {
        WritableMap result = Arguments.createMap();
        String uri = ExpFileUtils.uriFromFile(outputFile).toString();

        if (options.hasKey("base64") && options.getBoolean("base64")) {
          try {
            String base64 = encodeFromFile(outputFile);
            result.putString("base64", base64);
          } catch (IOException e) {
            promise.reject("E_PRINT_BASE64_FAILED", "An error occurred while encoding PDF file to base64 string.", e);
            return;
          }
        }

        result.putString("uri", uri);
        result.putInt("numberOfPages", numberOfPages);
        promise.resolve(result);
      }

      @Override
      public void onRenderError(String errorCode, String errorMessage, Exception exception) {
        promise.reject(errorCode, errorMessage, exception);
      }
    });
  }

  private void printDocumentToPrinter(PrintDocumentAdapter document, final ReadableMap options) {
    PrintManager printManager = (PrintManager) Exponent.getInstance().getCurrentActivity().getSystemService(Context.PRINT_SERVICE);
    PrintAttributes.Builder attributes = getAttributesFromOptions(options);

    printManager.print(mJobName, document, attributes.build());
  }

  private PrintAttributes.Builder getAttributesFromOptions(final ReadableMap options) {
    String orientation = options.hasKey("orientation") ? options.getString("orientation") : null;
    PrintAttributes.Builder builder = new PrintAttributes.Builder();

    // @tsapeta: Unfortunately these attributes might be ignored on some devices or Android versions,
    // in other words it might not change the default orientation in the print dialog,
    // however the user can change it there.
    if (ORIENTATION_LANDSCAPE.equals(orientation)) {
      builder.setMediaSize(PrintAttributes.MediaSize.UNKNOWN_LANDSCAPE);
    } else {
      builder.setMediaSize(PrintAttributes.MediaSize.UNKNOWN_PORTRAIT);
    }

    // @tsapeta: It should just copy the document without adding extra margins,
    // document's margins can be controlled by @page block in CSS.
    builder.setMinMargins(PrintAttributes.Margins.NO_MARGINS);

    return builder;
  }

  private String generateFilePath() throws IOException {
    return ExpFileUtils.generateOutputPath(mScopedContext.getCacheDir(), "Print", ".pdf");
  }

  private String encodeFromFile(File file) throws IOException {
    RandomAccessFile randomAccessFile = new RandomAccessFile(file, "r");
    byte[] fileBytes = new byte[(int)randomAccessFile.length()];
    randomAccessFile.readFully(fileBytes);
    return Base64.encodeToString(fileBytes, Base64.DEFAULT);
  }

  private InputStream decodeDataURI(String uri) {
    int base64Index = uri.indexOf(";base64,");
    String plainBase64 = uri.substring(base64Index + 8);
    byte[] byteArray = Base64.decode(plainBase64, Base64.DEFAULT);

    return new ByteArrayInputStream(byteArray);
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
