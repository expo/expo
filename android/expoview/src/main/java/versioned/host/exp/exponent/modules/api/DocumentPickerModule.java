package versioned.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Map;

import javax.annotation.Nullable;

import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.Constants;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;
import host.exp.expoview.Exponent;


public class DocumentPickerModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  private static int OPEN_DOCUMENT_CODE = 4137;

  private @Nullable Promise mPromise;
  private ScopedContext mScopedContext;

  private boolean mCopyToCacheDirectory = true;

  public DocumentPickerModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mScopedContext = scopedContext;

    Exponent.getInstance().addActivityResultListener(this);
  }

  @Override
  public String getName() {
    return "ExponentDocumentPicker";
  }

  @ReactMethod
  public void getDocumentAsync(ReadableMap options, Promise promise) {
    if (mPromise != null) {
      WritableMap result = Arguments.createMap();
      result.putString("type", "cancel");
      mPromise.resolve(result);
    }

    mPromise = promise;

    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    if (options.hasKey("type")) {
      intent.setType(options.getString("type"));
    } else {
      intent.setType("*/*");
    }

    if (options.hasKey("copyToCacheDirectory") && !options.getBoolean("copyToCacheDirectory")) {
      mCopyToCacheDirectory = false;
    } else {
      mCopyToCacheDirectory = true;
    }

    Activity activity = Exponent.getInstance().getCurrentActivity();
    activity.startActivityForResult(intent, OPEN_DOCUMENT_CODE);
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (requestCode == OPEN_DOCUMENT_CODE) {
      if (mPromise == null) {
        return;
      }

      WritableMap result = Arguments.createMap();
      if (resultCode == Activity.RESULT_OK) {
        result.putString("type", "success");
        Uri uri = data.getData();
        ContentResolver contentResolver = getReactApplicationContext().getContentResolver();
        try (Cursor cursor = contentResolver.query(uri, null, null, null, null)) {
          if (cursor != null && cursor.moveToFirst()) {
            String displayName = cursor.getString(cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME));
            result.putString("name", displayName);
            if (mCopyToCacheDirectory) {
              result.putString("uri", Uri.fromFile(new File(writeDocument(uri, contentResolver, displayName))).toString());
            } else {
              result.putString("uri", uri.toString());
            }

            int sizeColumnIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
            if (!cursor.isNull(sizeColumnIndex)) {
              int size = cursor.getInt(sizeColumnIndex);
              result.putInt("size", size);
            } else {
              result.putNull("size");
            }
          }
        }
      } else {
        result.putString("type", "cancel");
      }
      mPromise.resolve(result);
      mPromise = null;
    }
  }

  private String writeDocument(Uri uri, ContentResolver contentResolver, String name) {
    InputStream in;
    OutputStream out = null;
    String path = null;
    try {
      in = contentResolver.openInputStream(uri);
      path = ExpFileUtils.generateOutputPath(
          mScopedContext.getCacheDir(),
          "DocumentPicker",
          FilenameUtils.getExtension(name)
      );
      File file = new File(path);
      out = new FileOutputStream(file);
      IOUtils.copy(in, out);
    } catch (IOException e) {
      e.printStackTrace();
    } finally {
      if (out != null) {
        try {
          out.close();
        } catch (IOException e) {
          e.printStackTrace();
        }
      }
    }
    return path;
  }
}
