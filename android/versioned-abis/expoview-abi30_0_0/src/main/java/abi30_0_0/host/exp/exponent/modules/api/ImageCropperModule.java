package abi30_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import abi30_0_0.com.facebook.react.bridge.Arguments;
import abi30_0_0.com.facebook.react.bridge.Promise;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;
import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.com.facebook.react.bridge.ReadableType;
import abi30_0_0.com.facebook.react.bridge.WritableMap;
import com.theartofdev.edmodo.cropper.CropImage;

import host.exp.exponent.ActivityResultListener;
import host.exp.expoview.Exponent;

public class ImageCropperModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  private boolean mLaunchedCropImage = false; // To keep track of whether we were the one to launch CropImage last
  private Promise mPromise;

  public ImageCropperModule(ReactApplicationContext context) {
    super(context);

    Exponent.getInstance().addActivityResultListener(this);
  }

  @Override
  public String getName() {
    return "ExponentImageCropper";
  }

  @ReactMethod
  public void cropAsync(String uri, ReadableMap options, Promise promise) {
    CropImage.ActivityBuilder builder = CropImage.activity(Uri.parse(uri));

    ReadableArray aspect = null;
    if (options.hasKey("aspect")) {
      aspect = options.getArray("aspect");
      if (aspect.size() != 2 || aspect.getType(0) != ReadableType.Number ||
              aspect.getType(1) != ReadableType.Number) {
        promise.reject(new IllegalArgumentException("'aspect' option must be of form [Number, Number]"));
        return;
      }
      builder.
        setAspectRatio(aspect.getInt(0), aspect.getInt(1)).
        setFixAspectRatio(true).
        setInitialCropWindowPaddingRatio(0);
    }

    mLaunchedCropImage = true;
    mPromise = promise;
    builder.start(Exponent.getInstance().getCurrentActivity());
  }

  public void onActivityResult(final int requestCode, final int resultCode, final Intent intent) {
    if (requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE) {
      if (mLaunchedCropImage) {
        mLaunchedCropImage = false;
        if (resultCode != Activity.RESULT_OK) {
          WritableMap response = Arguments.createMap();
          response.putBoolean("cancelled", true);
          mPromise.resolve(response);
          return;
        }

        WritableMap response = Arguments.createMap();
        response.putBoolean("cancelled", false);

        CropImage.ActivityResult result = CropImage.getActivityResult(intent);
        Uri uri = result.getUri();
        response.putString("uri", uri.toString());

        int rot = result.getRotation() % 360;
        if (rot < 0) {
          rot += 360;
        }
        if (rot == 0 || rot == 180) { // Rotation is right-angled only
          response.putInt("width", result.getCropRect().width());
          response.putInt("height", result.getCropRect().height());
        } else {
          response.putInt("width", result.getCropRect().height());
          response.putInt("height", result.getCropRect().width());
        }

        mPromise.resolve(response);
      }
    }
  }
}
