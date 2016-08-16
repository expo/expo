package abi5_0_0.host.exp.exponent.modules.external.image_picker;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.ArrayAdapter;

import com.facebook.common.internal.ByteStreams;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import abi5_0_0.com.facebook.react.bridge.Arguments;
import abi5_0_0.com.facebook.react.bridge.Callback;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.bridge.ReactMethod;
import abi5_0_0.com.facebook.react.bridge.ReadableMap;
import abi5_0_0.com.facebook.react.bridge.WritableMap;
import host.exp.exponent.ActivityResultDelegator;
import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.experience.BaseExperienceActivity;

public class ImagePickerModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  static final int REQUEST_LAUNCH_CAMERA = 1;
  static final int REQUEST_LAUNCH_IMAGE_LIBRARY = 2;

  private final ReactApplicationContext mReactContext;
  private final BaseExperienceActivity mMainActivity;

  private Uri mCameraCaptureURI;
  private Callback mCallback;
  private Boolean noData = false;
  private int maxWidth = 0;
  private int maxHeight = 0;
  private int quality = 100;

  public ImagePickerModule(ReactApplicationContext reactContext, ActivityResultDelegator delegator) {
    super(reactContext);

    mReactContext = reactContext;
    mMainActivity = (BaseExperienceActivity) delegator;
    delegator.addActivityResultListener(this);
  }

  @Override
  public String getName() {
    return "UIImagePickerManager"; // To coincide with the iOS native module name
  }

  @ReactMethod
  public void showImagePicker(final ReadableMap options, final Callback callback) {
    List<String> mTitles = new ArrayList<String>();
    List<String> mActions = new ArrayList<String>();

    String cancelButtonTitle = "Cancel";

    if (options.hasKey("takePhotoButtonTitle")
        && !options.getString("takePhotoButtonTitle").isEmpty()) {
      mTitles.add(options.getString("takePhotoButtonTitle"));
      mActions.add("photo");
    }
    if (options.hasKey("chooseFromLibraryButtonTitle")
        && !options.getString("chooseFromLibraryButtonTitle").isEmpty()) {
      mTitles.add(options.getString("chooseFromLibraryButtonTitle"));
      mActions.add("library");
    }
    if (options.hasKey("cancelButtonTitle")
        && !options.getString("cancelButtonTitle").isEmpty()) {
      cancelButtonTitle = options.getString("cancelButtonTitle");
    }
    mTitles.add(cancelButtonTitle);
    mActions.add("cancel");

    String[] option = new String[mTitles.size()];
    option = mTitles.toArray(option);

    String[] action = new String[mActions.size()];
    action = mActions.toArray(action);
    final String[] act = action;

    ArrayAdapter<String> adapter = new ArrayAdapter<String>(mMainActivity,
        android.R.layout.select_dialog_item, option);
    AlertDialog.Builder builder = new AlertDialog.Builder(mMainActivity);
    if (options.hasKey("title") && !options.getString("title").isEmpty()) {
      builder.setTitle(options.getString("title"));
    }

    builder.setAdapter(adapter, new DialogInterface.OnClickListener() {
      public void onClick(DialogInterface dialog, int index) {
        if (act[index].equals("photo")) {
          launchCamera(options, callback);
        } else if (act[index].equals("library")) {
          launchImageLibrary(options, callback);
        } else {
          callback.invoke(true, Arguments.createMap());
        }
      }
    });

    final AlertDialog dialog = builder.create();
    /**
     * override onCancel method to callback cancel in case of a touch
     * outside of the dialog or the BACK key pressed
     */
    dialog.setOnCancelListener(new DialogInterface.OnCancelListener() {
      @Override
      public void onCancel(DialogInterface dialog) {
        dialog.dismiss();
        callback.invoke(true, Arguments.createMap());
      }
    });
    dialog.show();
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ReactMethod
  public void launchCamera(final ReadableMap options, final Callback callback) {
    if (options.hasKey("noData")) {
      noData = options.getBoolean("noData");
    }
    if (options.hasKey("maxWidth")) {
      maxWidth = options.getInt("maxWidth");
    }
    if (options.hasKey("maxHeight")) {
      maxHeight = options.getInt("maxHeight");
    }
    if (options.hasKey("quality")) {
      quality = (int) (options.getDouble("quality") * 100);
    }

    final Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
    if (cameraIntent.resolveActivity(mMainActivity.getApplication().getPackageManager()) == null) {
      callback.invoke(true, "Error resolving activity");
      return;
    }

    mMainActivity.getPermissions(new BaseExperienceActivity.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        launchCameraWithPermissionsGranted(callback, cameraIntent);
      }

      @Override
      public void permissionsDenied() {
        callback.invoke(true, "User rejected permissions");
      }
    }, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.CAMERA});
  }

  private void launchCameraWithPermissionsGranted(Callback callback, Intent cameraIntent) {
    // we create a tmp file to save the result
    File imageFile;
    try {
      imageFile = File.createTempFile("exponent_capture_", ".jpg",
          Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES));
    } catch (IOException e) {
      e.printStackTrace();
      return;
    }
    if (imageFile == null) {
      callback.invoke(true, "error file not created");
      return;
    }
    cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, Uri.fromFile(imageFile));
    mCameraCaptureURI = Uri.fromFile(imageFile);
    mCallback = callback;
    mMainActivity.startActivityForResult(cameraIntent, REQUEST_LAUNCH_CAMERA);
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ReactMethod
  public void launchImageLibrary(final ReadableMap options, final Callback callback) {
    if (options.hasKey("noData")) {
      noData = options.getBoolean("noData");
    }
    if (options.hasKey("maxWidth")) {
      maxWidth = options.getInt("maxWidth");
    }
    if (options.hasKey("maxHeight")) {
      maxHeight = options.getInt("maxHeight");
    }
    if (options.hasKey("quality")) {
      quality = (int) (options.getDouble("quality") * 100);
    }

    mMainActivity.getPermissions(new BaseExperienceActivity.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        launchImageLibraryWithPermissionsGranted(callback);
      }

      @Override
      public void permissionsDenied() {
        callback.invoke(true, "User rejected permissions");
      }
    }, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE});
  }

  private void launchImageLibraryWithPermissionsGranted(Callback callback) {
    Intent libraryIntent = new Intent();
    libraryIntent.setType("image/*");
    libraryIntent.setAction(Intent.ACTION_GET_CONTENT);
    mCallback = callback;
    mMainActivity.startActivityForResult(libraryIntent, REQUEST_LAUNCH_IMAGE_LIBRARY);
  }

  public void onActivityResult(final int requestCode, final int resultCode, final Intent intent) {
    //robustness code
    if (mCallback == null || (mCameraCaptureURI == null && requestCode == REQUEST_LAUNCH_CAMERA)
        || (requestCode != REQUEST_LAUNCH_CAMERA && requestCode != REQUEST_LAUNCH_IMAGE_LIBRARY)) {
      return;
    }

    // unset saved callback
    final Callback callback = mCallback;
    mCallback = null;

    // user cancel
    if (resultCode != Activity.RESULT_OK) {
      callback.invoke(true, Arguments.createMap());
      return;
    }

    AsyncTask.execute(new Runnable() {
      @Override
      public void run() {
        WritableMap response = Arguments.createMap();

        String realPath;
        realPath = (requestCode == REQUEST_LAUNCH_CAMERA)
            ? mCameraCaptureURI.getPath()
            : getRealPathFromURI(mReactContext, intent.getData());

        boolean isVertical = true;
        float rotation = 0;

        try {
          ExifInterface exif = new ExifInterface(realPath);
          int orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
          switch (orientation) {
            case ExifInterface.ORIENTATION_ROTATE_270:
              rotation = 270;
              isVertical = false;
              break;
            case ExifInterface.ORIENTATION_ROTATE_90:
              rotation = 90;
              isVertical = false;
              break;
          }
          response.putBoolean("isVertical", isVertical);
        } catch (IOException e) {
          e.printStackTrace();
        }

        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(realPath, options);
        int initialWidth = options.outWidth;
        int initialHeight = options.outHeight;

        // don't create a new file if constraints are respected
        if (((initialWidth <= maxWidth && maxWidth > 0) || maxWidth == 0)
            && ((initialHeight <= maxHeight && maxHeight > 0) || maxHeight == 0)
            && quality == 100) {
          response.putInt("width", initialWidth);
          response.putInt("height", initialHeight);
        } else {
          realPath = getResizedImage(realPath, initialWidth, initialHeight);
          BitmapFactory.decodeFile(realPath, options);
          response.putInt("width", options.outWidth);
          response.putInt("height", options.outHeight);
        }

        if (!isVertical) {
          realPath = getRotatedImage(realPath, rotation);
        }

        response.putString("uri", Uri.fromFile(new File(realPath)).toString());

        if (!noData) {
          response.putString("data", getBase64StringFromFile(realPath));
        }
        callback.invoke(false, response);
      }
    });
  }

  public static String getRealPathFromURI(Context context, Uri contentUri) {
    String wholeID = DocumentsContract.getDocumentId(contentUri);

    // Split at colon, use second item in the array
    String id = wholeID.split(":")[1];
    String[] column = { MediaStore.Images.Media.DATA };

    // where id is equal to
    String sel = MediaStore.Images.Media._ID + "=?";
    Cursor cursor = context.getContentResolver().
            query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    column, sel, new String[]{ id }, null);

    String filePath = "";
    int columnIndex = cursor.getColumnIndex(column[0]);
    if (cursor.moveToFirst()) {
      filePath = cursor.getString(columnIndex);
    }

    cursor.close();
    return filePath;
  }

  private String getBase64StringFromFile(String absoluteFilePath) {
    InputStream inputStream = null;
    try {
      inputStream = new FileInputStream(absoluteFilePath);
    } catch (FileNotFoundException e) {
      e.printStackTrace();
    }

    byte[] bytes;
    byte[] buffer = new byte[8192];
    int bytesRead;
    ByteArrayOutputStream output = new ByteArrayOutputStream();
    try {
      while ((bytesRead = inputStream.read(buffer)) != -1) {
        output.write(buffer, 0, bytesRead);
      }
    } catch (IOException e) {
      e.printStackTrace();
    }
    bytes = output.toByteArray();
    return Base64.encodeToString(bytes, Base64.NO_WRAP);
  }

  /**
   * Create a resized image to fill the maxWidth and maxHeight values and the
   * quality value
   *
   * @param realPath
   * @param initialWidth
   * @param initialHeight
   * @return absolute path of resized file
   */
  private String getResizedImage(final String realPath, final int initialWidth, final int initialHeight) {
    Bitmap photo = BitmapFactory.decodeFile(realPath);

    Bitmap scaledphoto = null;
    if (maxWidth == 0) {
      maxWidth = initialWidth;
    }
    if (maxHeight == 0) {
      maxHeight = initialHeight;
    }
    double widthRatio = (double) maxWidth / initialWidth;
    double heightRatio = (double) maxHeight / initialHeight;

    double ratio = (widthRatio < heightRatio)
        ? widthRatio
        : heightRatio;

    int newWidth = (int) (initialWidth * ratio);
    int newHeight = (int) (initialHeight * ratio);

    scaledphoto = Bitmap.createScaledBitmap(photo, newWidth, newHeight, true);
    return writeImage(scaledphoto);
  }

  private String getRotatedImage(final String realPath, float degrees) {
    Bitmap photo = BitmapFactory.decodeFile(realPath);
    Matrix matrix = new Matrix();
    matrix.postRotate(degrees);
    return writeImage(Bitmap.createBitmap(photo, 0, 0, photo.getWidth(), photo.getHeight(), matrix, true));
  }

  private String writeImage(Bitmap image) {
    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
    image.compress(Bitmap.CompressFormat.JPEG, quality, bytes);
    String filname = UUID.randomUUID().toString();
    File f = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES) + File.separator + filname + ".jpg");
    try {
      f.createNewFile();
    } catch (IOException e) {
      e.printStackTrace();
    }
    FileOutputStream fo;
    try {
      fo = new FileOutputStream(f);
      try {
        fo.write(bytes.toByteArray());
      } catch (IOException e) {
        e.printStackTrace();
      }
    } catch (FileNotFoundException e) {
      e.printStackTrace();
    }
    return f.getAbsolutePath();
  }
}
