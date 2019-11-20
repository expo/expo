package abi34_0_0.host.exp.exponent.modules.api.components.webview;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Parcelable;
import android.provider.MediaStore;
import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import android.util.Log;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.widget.Toast;

import abi34_0_0.com.facebook.react.bridge.ActivityEventListener;
import abi34_0_0.com.facebook.react.bridge.Promise;
import abi34_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi34_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi34_0_0.com.facebook.react.bridge.ReactMethod;
import abi34_0_0.com.facebook.react.module.annotations.ReactModule;
import abi34_0_0.com.facebook.react.modules.core.PermissionAwareActivity;
import abi34_0_0.com.facebook.react.modules.core.PermissionListener;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;

import static android.app.Activity.RESULT_OK;

@ReactModule(name = RNCWebViewModule.MODULE_NAME)
public class RNCWebViewModule extends ReactContextBaseJavaModule implements ActivityEventListener {
  public static final String MODULE_NAME = "RNCWebView";
  private static final int PICKER = 1;
  private static final int PICKER_LEGACY = 3;
  private static final int FILE_DOWNLOAD_PERMISSION_REQUEST = 1;
  final String DEFAULT_MIME_TYPES = "*/*";
  private ValueCallback<Uri> filePathCallbackLegacy;
  private ValueCallback<Uri[]> filePathCallback;
  private Uri outputFileUri;
  private DownloadManager.Request downloadRequest;
  private PermissionListener webviewFileDownloaderPermissionListener = new PermissionListener() {
    @Override
    public boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
      switch (requestCode) {
        case FILE_DOWNLOAD_PERMISSION_REQUEST: {
          // If request is cancelled, the result arrays are empty.
          if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            if (downloadRequest != null) {
              downloadFile();
            }
          } else {
            Toast.makeText(getCurrentActivity().getApplicationContext(), "Cannot download files as permission was denied. Please provide permission to write to storage, in order to download files.", Toast.LENGTH_LONG).show();
          }
          return true;
        }
      }
      return false;
    }
  };

  public RNCWebViewModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addActivityEventListener(this);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @ReactMethod
  public void isFileUploadSupported(final Promise promise) {
    Boolean result = false;
    int current = Build.VERSION.SDK_INT;
    if (current >= Build.VERSION_CODES.LOLLIPOP) {
      result = true;
    }
    if (current >= Build.VERSION_CODES.JELLY_BEAN && current <= Build.VERSION_CODES.JELLY_BEAN_MR2) {
      result = true;
    }
    promise.resolve(result);
  }

  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {

    if (filePathCallback == null && filePathCallbackLegacy == null) {
      return;
    }

    // based off of which button was pressed, we get an activity result and a file
    // the camera activity doesn't properly return the filename* (I think?) so we use
    // this filename instead
    switch (requestCode) {
      case PICKER:
        if (resultCode != RESULT_OK) {
          if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
          }
        } else {
          Uri result[] = this.getSelectedFiles(data, resultCode);
          if (result != null) {
            filePathCallback.onReceiveValue(result);
          } else {
            filePathCallback.onReceiveValue(new Uri[]{outputFileUri});
          }
        }
        break;
      case PICKER_LEGACY:
        Uri result = resultCode != Activity.RESULT_OK ? null : data == null ? outputFileUri : data.getData();
        filePathCallbackLegacy.onReceiveValue(result);
        break;

    }
    filePathCallback = null;
    filePathCallbackLegacy = null;
    outputFileUri = null;
  }

  public void onNewIntent(Intent intent) {
  }

  private Uri[] getSelectedFiles(Intent data, int resultCode) {
    if (data == null) {
      return null;
    }

    // we have one file selected
    if (data.getData() != null) {
      if (resultCode == RESULT_OK && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        return WebChromeClient.FileChooserParams.parseResult(resultCode, data);
      } else {
        return null;
      }
    }

    // we have multiple files selected
    if (data.getClipData() != null) {
      final int numSelectedFiles = data.getClipData().getItemCount();
      Uri[] result = new Uri[numSelectedFiles];
      for (int i = 0; i < numSelectedFiles; i++) {
        result[i] = data.getClipData().getItemAt(i).getUri();
      }
      return result;
    }
    return null;
  }

  public void startPhotoPickerIntent(ValueCallback<Uri> filePathCallback, String acceptType) {
    filePathCallbackLegacy = filePathCallback;

    Intent fileChooserIntent = getFileChooserIntent(acceptType);
    Intent chooserIntent = Intent.createChooser(fileChooserIntent, "");

    ArrayList<Parcelable> extraIntents = new ArrayList<>();
    if (acceptsImages(acceptType)) {
      extraIntents.add(getPhotoIntent());
    }
    if (acceptsVideo(acceptType)) {
      extraIntents.add(getVideoIntent());
    }
    chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, extraIntents.toArray(new Parcelable[]{}));

    if (chooserIntent.resolveActivity(getCurrentActivity().getPackageManager()) != null) {
      getCurrentActivity().startActivityForResult(chooserIntent, PICKER_LEGACY);
    } else {
      Log.w("RNCWebViewModule", "there is no Activity to handle this Intent");
    }
  }

  @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
  public boolean startPhotoPickerIntent(final ValueCallback<Uri[]> callback, final Intent intent, final String[] acceptTypes, final boolean allowMultiple) {
    filePathCallback = callback;

    ArrayList<Parcelable> extraIntents = new ArrayList<>();
    if (acceptsImages(acceptTypes)) {
      extraIntents.add(getPhotoIntent());
    }
    if (acceptsVideo(acceptTypes)) {
      extraIntents.add(getVideoIntent());
    }

    Intent fileSelectionIntent = getFileChooserIntent(acceptTypes, allowMultiple);

    Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
    chooserIntent.putExtra(Intent.EXTRA_INTENT, fileSelectionIntent);
    chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, extraIntents.toArray(new Parcelable[]{}));

    if (chooserIntent.resolveActivity(getCurrentActivity().getPackageManager()) != null) {
      getCurrentActivity().startActivityForResult(chooserIntent, PICKER);
    } else {
      Log.w("RNCWebViewModule", "there is no Activity to handle this Intent");
    }

    return true;
  }

  public void setDownloadRequest(DownloadManager.Request request) {
    this.downloadRequest = request;
  }

  public void downloadFile() {
    DownloadManager dm = (DownloadManager) getCurrentActivity().getBaseContext().getSystemService(Context.DOWNLOAD_SERVICE);
    String downloadMessage = "Downloading";

    dm.enqueue(this.downloadRequest);

    Toast.makeText(getCurrentActivity().getApplicationContext(), downloadMessage, Toast.LENGTH_LONG).show();
  }

  public boolean grantFileDownloaderPermissions() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return true;
    }

    boolean result = true;
    if (ContextCompat.checkSelfPermission(getCurrentActivity(), Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
      result = false;
    }

    if (!result) {
      PermissionAwareActivity activity = getPermissionAwareActivity();
      activity.requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, FILE_DOWNLOAD_PERMISSION_REQUEST, webviewFileDownloaderPermissionListener);
    }

    return result;
  }

  private Intent getPhotoIntent() {
    Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
    outputFileUri = getOutputUri(MediaStore.ACTION_IMAGE_CAPTURE);
    intent.putExtra(MediaStore.EXTRA_OUTPUT, outputFileUri);
    return intent;
  }

  private Intent getVideoIntent() {
    Intent intent = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
    // @todo from experience, for Videos we get the data onActivityResult
    // so there's no need to store the Uri
    Uri outputVideoUri = getOutputUri(MediaStore.ACTION_VIDEO_CAPTURE);
    intent.putExtra(MediaStore.EXTRA_OUTPUT, outputVideoUri);
    return intent;
  }

  private Intent getFileChooserIntent(String acceptTypes) {
    String _acceptTypes = acceptTypes;
    if (acceptTypes.isEmpty()) {
      _acceptTypes = DEFAULT_MIME_TYPES;
    }
    if (acceptTypes.matches("\\.\\w+")) {
      _acceptTypes = getMimeTypeFromExtension(acceptTypes.replace(".", ""));
    }
    Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType(_acceptTypes);
    return intent;
  }

  private Intent getFileChooserIntent(String[] acceptTypes, boolean allowMultiple) {
    Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("*/*");
    intent.putExtra(Intent.EXTRA_MIME_TYPES, getAcceptedMimeType(acceptTypes));
    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, allowMultiple);
    return intent;
  }

  private Boolean acceptsImages(String types) {
    String mimeType = types;
    if (types.matches("\\.\\w+")) {
      mimeType = getMimeTypeFromExtension(types.replace(".", ""));
    }
    return mimeType.isEmpty() || mimeType.toLowerCase().contains("image");
  }

  private Boolean acceptsImages(String[] types) {
    String[] mimeTypes = getAcceptedMimeType(types);
    return isArrayEmpty(mimeTypes) || arrayContainsString(mimeTypes, "image");
  }

  private Boolean acceptsVideo(String types) {
    String mimeType = types;
    if (types.matches("\\.\\w+")) {
      mimeType = getMimeTypeFromExtension(types.replace(".", ""));
    }
    return mimeType.isEmpty() || mimeType.toLowerCase().contains("video");
  }

  private Boolean acceptsVideo(String[] types) {
    String[] mimeTypes = getAcceptedMimeType(types);
    return isArrayEmpty(mimeTypes) || arrayContainsString(mimeTypes, "video");
  }

  private Boolean arrayContainsString(String[] array, String pattern) {
    for (String content : array) {
      if (content.contains(pattern)) {
        return true;
      }
    }
    return false;
  }

  private String[] getAcceptedMimeType(String[] types) {
    if (isArrayEmpty(types)) {
      return new String[]{DEFAULT_MIME_TYPES};
    }
    String[] mimeTypes = new String[types.length];
    for (int i = 0; i < types.length; i++) {
      String t = types[i];
      // convert file extensions to mime types
      if (t.matches("\\.\\w+")) {
        String mimeType = getMimeTypeFromExtension(t.replace(".", ""));
        mimeTypes[i] = mimeType;
      } else {
        mimeTypes[i] = t;
      }
    }
    return mimeTypes;
  }

  private String getMimeTypeFromExtension(String extension) {
    String type = null;
    if (extension != null) {
      type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
    }
    return type;
  }

  private Uri getOutputUri(String intentType) {
    File capturedFile = null;
    try {
      capturedFile = getCapturedFile(intentType);
    } catch (IOException e) {
      Log.e("CREATE FILE", "Error occurred while creating the File", e);
      e.printStackTrace();
    }

    // for versions below 6.0 (23) we use the old File creation & permissions model
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return Uri.fromFile(capturedFile);
    }

    // for versions 6.0+ (23) we use the FileProvider to avoid runtime permissions
    String packageName = getReactApplicationContext().getPackageName();
    return FileProvider.getUriForFile(getReactApplicationContext(), packageName + ".fileprovider", capturedFile);
  }

  private File getCapturedFile(String intentType) throws IOException {
    String prefix = "";
    String suffix = "";
    String dir = "";
    String filename = "";

    if (intentType.equals(MediaStore.ACTION_IMAGE_CAPTURE)) {
      prefix = "image-";
      suffix = ".jpg";
      dir = Environment.DIRECTORY_PICTURES;
    } else if (intentType.equals(MediaStore.ACTION_VIDEO_CAPTURE)) {
      prefix = "video-";
      suffix = ".mp4";
      dir = Environment.DIRECTORY_MOVIES;
    }

    filename = prefix + String.valueOf(System.currentTimeMillis()) + suffix;

    // for versions below 6.0 (23) we use the old File creation & permissions model
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      // only this Directory works on all tested Android versions
      // ctx.getExternalFilesDir(dir) was failing on Android 5.0 (sdk 21)
      File storageDir = Environment.getExternalStoragePublicDirectory(dir);
      return new File(storageDir, filename);
    }

    File storageDir = getReactApplicationContext().getExternalFilesDir(null);
    return File.createTempFile(filename, suffix, storageDir);
  }

  private Boolean isArrayEmpty(String[] arr) {
    // when our array returned from getAcceptTypes() has no values set from the webview
    // i.e. <input type="file" />, without any "accept" attr
    // will be an array with one empty string element, afaik
    return arr.length == 0 || (arr.length == 1 && arr[0].length() == 0);
  }

  private PermissionAwareActivity getPermissionAwareActivity() {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      throw new IllegalStateException("Tried to use permissions API while not attached to an Activity.");
    } else if (!(activity instanceof PermissionAwareActivity)) {
      throw new IllegalStateException("Tried to use permissions API but the host Activity doesn't implement PermissionAwareActivity.");
    }
    return (PermissionAwareActivity) activity;
  }
}
