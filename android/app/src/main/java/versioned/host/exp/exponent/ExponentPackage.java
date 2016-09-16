// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import host.exp.exponent.ActivityResultDelegator;
import host.exp.exponent.ExponentApplication;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.modules.ExponentKernelModule;
import versioned.host.exp.exponent.modules.api.AmplitudeModule;
import versioned.host.exp.exponent.modules.api.ConstantsModule;
import versioned.host.exp.exponent.modules.api.ContactsModule;
import versioned.host.exp.exponent.modules.api.CryptoModule;
import versioned.host.exp.exponent.modules.api.FabricModule;
import versioned.host.exp.exponent.modules.api.FacebookModule;
import versioned.host.exp.exponent.modules.api.FileSystemModule;
import versioned.host.exp.exponent.modules.api.FingerprintModule;
import versioned.host.exp.exponent.modules.api.FontLoaderModule;
import versioned.host.exp.exponent.modules.api.ImageCropperModule;
import versioned.host.exp.exponent.modules.api.ImagePickerModule;
import versioned.host.exp.exponent.modules.api.KeyboardModule;
import versioned.host.exp.exponent.modules.api.LocationModule;
import versioned.host.exp.exponent.modules.api.NotificationsModule;
import versioned.host.exp.exponent.modules.api.PermissionsModule;
import versioned.host.exp.exponent.modules.api.SegmentModule;
import versioned.host.exp.exponent.modules.api.ShakeModule;
import versioned.host.exp.exponent.modules.api.URLHandlerModule;
import versioned.host.exp.exponent.modules.api.UtilModule;
import versioned.host.exp.exponent.modules.api.components.LinearGradientManager;
import versioned.host.exp.exponent.modules.api.components.VideoViewManager;
import versioned.host.exp.exponent.modules.api.components.svg.RNSvgPackage;
import versioned.host.exp.exponent.modules.api.components.maps.MapsPackage;
import versioned.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import versioned.host.exp.exponent.modules.internal.ExponentIntentModule;
import versioned.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;

public class ExponentPackage implements ReactPackage {

  private static final String TAG = ExponentPackage.class.getSimpleName();

  private final ExponentApplication mApplication;
  private final boolean mIsKernel;
  private final Map<String, Object> mExperienceProperties;
  private final JSONObject mManifest;
  private final ActivityResultDelegator mDelegator;

  public ExponentPackage(ExponentApplication application, Map<String, Object> experienceProperties,
                         JSONObject manifest, ActivityResultDelegator delegator) {
    mApplication = application;
    mIsKernel = false;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
    mDelegator = delegator;
  }

  public ExponentPackage(ExponentApplication application) {
    mApplication = application;
    mIsKernel = true;
    mExperienceProperties = null;
    mManifest = new JSONObject();
    mDelegator = null;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    boolean isVerified = false;
    if (mManifest != null) {
      isVerified = mManifest.optBoolean(ExponentManifest.MANIFEST_IS_VERIFIED_KEY);
    }

    List<NativeModule> nativeModules = new ArrayList<>(Arrays.<NativeModule>asList(
        new URLHandlerModule(reactContext, mApplication),
        new ConstantsModule(reactContext, mApplication, mExperienceProperties, mManifest),
        new ShakeModule(reactContext),
        new FontLoaderModule(reactContext),
        new KeyboardModule(reactContext),
        new UtilModule(reactContext, mApplication, mExperienceProperties),
        new ExponentIntentModule(reactContext, mApplication, mExperienceProperties)
    ));

    if (mIsKernel) {
      // Never need this in versioned code. Comment this out if this is in an abi package
      nativeModules.add(new ExponentKernelModule(reactContext, mApplication));
    } else {
      if (isVerified) {
        try {
          String experienceId = mManifest.getString(ExponentManifest.MANIFEST_ID_KEY);
          String experienceIdEncoded = URLEncoder.encode(experienceId, "UTF-8");

          nativeModules.add(new ExponentAsyncStorageModule(reactContext, mManifest));
          nativeModules.add(new NotificationsModule(reactContext, mApplication, mManifest));
          nativeModules.add(new ContactsModule(reactContext, mApplication));
          nativeModules.add(new FileSystemModule(reactContext, mManifest));
          nativeModules.add(new LocationModule(reactContext));
          nativeModules.add(new CryptoModule(reactContext));
          nativeModules.add(new ImagePickerModule(reactContext, mDelegator));
          nativeModules.add(new FacebookModule(reactContext, mDelegator, mApplication));
          nativeModules.add(new FabricModule(reactContext, mExperienceProperties));
          nativeModules.add(new FingerprintModule(reactContext));
          nativeModules.add(new PermissionsModule(reactContext));
          nativeModules.add(new AmplitudeModule(reactContext, experienceIdEncoded));
          nativeModules.add(new SegmentModule(reactContext, experienceIdEncoded));
        } catch (JSONException e) {
          EXL.e(TAG, e.toString());
        } catch (UnsupportedEncodingException e) {
          EXL.e(TAG, e.toString());
        }
      } else {
        nativeModules.add(new ExponentUnsignedAsyncStorageModule(reactContext));
      }
      nativeModules.add(new ImageCropperModule(reactContext, mDelegator));
    }

    return nativeModules;
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> viewManagers = new ArrayList<>(Arrays.<ViewManager>asList(
        new LinearGradientManager(),
        new VideoViewManager()
    ));

    // Add view managers from the react-native-svg package.
    RNSvgPackage svgPackage = new RNSvgPackage();
    viewManagers.addAll(svgPackage.createViewManagers(reactContext));

    // Add view managers from the react-native-maps package.
    MapsPackage mapsPackage = new MapsPackage();
    viewManagers.addAll(mapsPackage.createViewManagers(reactContext));

    return viewManagers;
  }
}
