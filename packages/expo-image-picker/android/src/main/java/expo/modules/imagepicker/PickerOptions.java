package expo.modules.imagepicker;

import android.text.TextUtils;

import org.unimodules.core.Promise;

import java.util.ArrayList;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class PickerOptions {
  private int mQuality;
  private boolean mAllowsEditing;
  private ArrayList<Object> mForceAspect;
  private boolean mBase64;
  private String mMediaTypes;
  private boolean mExif;

  private PickerOptions() {
    mQuality = ImagePickerConstance.DEFAULT_QUALITY;
    mAllowsEditing = false;
    mForceAspect = null;
    mBase64 = false;
    mMediaTypes = "Images";
    mExif = false;
  }

  @Nullable
  public static PickerOptions fromMap(final @NonNull Map<String, Object> options, final Promise promise) {
    PickerOptions pickerOptions = new PickerOptions();
    if (options.containsKey((ImagePickerConstance.OPTION_QUALITY))) {
      Number quality = (Number) options.get(ImagePickerConstance.OPTION_QUALITY);
      if (quality == null) {
        promise.reject(ImagePickerConstance.ERR_INVALID_OPTION, "Quality can not be `null`.");
        return null;
      }

      pickerOptions.mQuality = (int) (quality.doubleValue() * 100);
    }

    if (options.containsKey(ImagePickerConstance.OPTION_ALLOWS_EDITING)) {
      pickerOptions.mAllowsEditing = (boolean) options.get(ImagePickerConstance.OPTION_ALLOWS_EDITING);
    }

    if (options.containsKey(ImagePickerConstance.OPTION_MEDIA_TYPES)) {
      pickerOptions.mMediaTypes = (String) options.get(ImagePickerConstance.OPTION_MEDIA_TYPES);
      if (TextUtils.isEmpty(pickerOptions.mMediaTypes)) {
        promise.reject(ImagePickerConstance.ERR_INVALID_OPTION, "MediaType can not be empty.");
        return null;
      }
    }

    if (options.containsKey(ImagePickerConstance.OPTION_ASPECT)) {
      pickerOptions.mForceAspect = (ArrayList<Object>) options.get(ImagePickerConstance.OPTION_ASPECT);
      if (pickerOptions.mForceAspect == null || pickerOptions.mForceAspect.size() != 2 || !(pickerOptions.mForceAspect.get(0) instanceof Number) ||
        !(pickerOptions.mForceAspect.get(1) instanceof Number)) {
        promise.reject(ImagePickerConstance.ERR_INVALID_OPTION, "'Aspect option must be of form [Number, Number]");
        return null;
      }
    }

    if (options.containsKey(ImagePickerConstance.OPTION_BASE64)) {
      pickerOptions.mBase64 = (boolean) options.get(ImagePickerConstance.OPTION_BASE64);
    }

    if (options.containsKey(ImagePickerConstance.OPTION_EXIF)) {
      pickerOptions.mExif = (boolean) options.get(ImagePickerConstance.OPTION_EXIF);
    }

    return pickerOptions;
  }

  public boolean isAllowsEditing() {
    return mAllowsEditing;
  }

  @Nullable
  public ArrayList<Object> getForceAspect() {
    return mForceAspect;
  }

  public boolean isBase64() {
    return mBase64;
  }

  @NonNull
  public String getMediaTypes() {
    return mMediaTypes;
  }

  public boolean isExif() {
    return mExif;
  }

  public int getQuality() {
    return mQuality;
  }
}
