// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.universal;

import android.content.Context;
import android.content.res.Resources;
import android.support.annotation.Nullable;
import android.util.DisplayMetrics;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;

import javax.inject.Inject;

import expo.interfaces.constants.ConstantsInterface;
import expo.modules.constants.ConstantsService;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExpoViewKernel;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class ConstantsBinding extends ConstantsService implements ConstantsInterface {

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  private final Map<String, Object> mExperienceProperties;
  private JSONObject mManifest;

  private static int convertPixelsToDp(float px, Context context) {
    Resources resources = context.getResources();
    DisplayMetrics metrics = resources.getDisplayMetrics();
    float dp = px / (metrics.densityDpi / 160f);
    return (int) dp;
  }

  public ConstantsBinding(Context context, Map<String, Object> experienceProperties, JSONObject manifest) {
    super(context);
    NativeModuleDepsProvider.getInstance().inject(ConstantsBinding.class, this);

    mManifest = manifest;
    mExperienceProperties = experienceProperties;

    if (!manifest.has(ExponentManifest.MANIFEST_STATUS_BAR_COLOR)) {
      int resourceId = mContext.getResources().getIdentifier("status_bar_height", "dimen", "android");
      if (resourceId > 0) {
        int statusBarHeightPixels = mContext.getResources().getDimensionPixelSize(resourceId);
        // Convert from pixels to dip
        mStatusBarHeight = convertPixelsToDp(statusBarHeightPixels, mContext);
      }
    } else {
      mStatusBarHeight = 0;
    }
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = super.getConstants();

    constants.put("expoVersion", ExpoViewKernel.getInstance().getVersionName());
    constants.put("installationId", mExponentSharedPreferences.getOrCreateUUID());
    constants.put("manifest", mManifest.toString());

    if (mExperienceProperties != null) {
      constants.put("appOwnership", getAppOwnership());
      constants.putAll(mExperienceProperties);
    }

    Map<String, Object> platform = new HashMap<>();
    Map<String, Object> androidPlatform = new HashMap<>();

    androidPlatform.put("versionCode", Constants.ANDROID_VERSION_CODE);
    platform.put("android", androidPlatform);
    constants.put("platform", platform);

    return constants;
  }

  public String getAppOwnership() {
    if (mExperienceProperties.containsKey(KernelConstants.MANIFEST_URL_KEY)) {
      String manifestUrl = (String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY);

      if (Constants.INITIAL_URL == null) {
        return "expo";
      } else if (manifestUrl.equals(Constants.INITIAL_URL)) {
        return "standalone";
      } else {
        return "guest";
      }
    } else {
      return "expo";
    }
  }
}
