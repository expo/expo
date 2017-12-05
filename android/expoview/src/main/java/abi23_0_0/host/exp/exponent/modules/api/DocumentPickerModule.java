package abi23_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import abi23_0_0.com.facebook.react.bridge.Arguments;
import abi23_0_0.com.facebook.react.bridge.Promise;
import abi23_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi23_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi23_0_0.com.facebook.react.bridge.ReactMethod;
import abi23_0_0.com.facebook.react.bridge.ReadableMap;
import abi23_0_0.com.facebook.react.bridge.WritableMap;

import java.util.Map;

import javax.annotation.Nullable;

import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.Constants;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.expoview.Exponent;


public class DocumentPickerModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  private static int OPEN_DOCUMENT_CODE = 4137;

  private @Nullable Promise mPromise;

  public DocumentPickerModule(ReactApplicationContext reactContext) {
    super(reactContext);

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
        result.putString("uri", uri.toString());
        ContentResolver contentResolver = getReactApplicationContext().getContentResolver();
        try (Cursor cursor = contentResolver.query(uri, null, null, null, null)) {
          if (cursor != null && cursor.moveToFirst()) {
            String displayName = cursor.getString(cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME));
            result.putString("name", displayName);

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
}
