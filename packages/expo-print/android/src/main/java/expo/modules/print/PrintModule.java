package expo.modules.print;

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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.net.URL;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.Promise;

public class PrintModule extends ExportedModule implements ModuleRegistryConsumer {

  private static String ORIENTATION_PORTRAIT = "portrait";
  private static String ORIENTATION_LANDSCAPE = "landscape";

  private final String mJobName = "Printing";

  private Context mContext;
  private ModuleRegistry mModuleRegistry = null;

  public PrintModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
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

  @ExpoMethod
  public void print(final Map<String, Object> options, final Promise promise) {
    final String html = options.containsKey("html") ? (String)options.get("html") : null;
    final String uri = options.containsKey("uri") ? (String)options.get("uri") : null;

    if (html != null) {
      // Renders HTML to PDF and then prints

      try {
        PrintPDFRenderTask renderTask = new PrintPDFRenderTask(mContext, options, mModuleRegistry);

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
                      inputStream = mContext.getContentResolver().openInputStream(Uri.parse(uri));
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

  @ExpoMethod
  public void printToFileAsync(final Map<String, Object> options, final Promise promise) {
    String filePath = null;

    try {
      filePath = generateFilePath();
    } catch (IOException e) {
      promise.reject("E_PRINT_FAILED", "An unknown I/O exception occurred.", e);
      return;
    }

    PrintPDFRenderTask renderTask = new PrintPDFRenderTask(mContext, options, mModuleRegistry);

    renderTask.render(filePath, new PrintPDFRenderTask.Callbacks() {
      @Override
      public void onRenderFinished(PrintDocumentAdapter document, File outputFile, int numberOfPages) {
        Bundle result = new Bundle();
        String uri = FileUtils.uriFromFile(outputFile).toString();

        if (options.containsKey("base64") && (Boolean)options.get("base64")) {
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

  private void printDocumentToPrinter(PrintDocumentAdapter document, final Map<String, Object> options) {
    PrintManager printManager = (PrintManager)mModuleRegistry.getModule(ActivityProvider.class)
                                                              .getCurrentActivity()
                                                              .getSystemService(Context.PRINT_SERVICE);
    PrintAttributes.Builder attributes = getAttributesFromOptions(options);

    printManager.print(mJobName, document, attributes.build());
  }

  private PrintAttributes.Builder getAttributesFromOptions(final Map<String, Object> options) {
    String orientation = options.containsKey("orientation") ? (String)options.get("orientation") : null;
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
    return FileUtils.generateOutputPath(mContext.getCacheDir(), "Print", ".pdf");
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
