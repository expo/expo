// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent;

import abi28_0_0.com.facebook.react.ReactPackage;
import abi28_0_0.com.facebook.react.bridge.NativeModule;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.utils.ScopedContext;
import abi28_0_0.host.exp.exponent.modules.api.BrightnessModule;
import abi28_0_0.host.exp.exponent.modules.api.ImageManipulatorModule;
import abi28_0_0.host.exp.exponent.modules.api.MailComposerModule;
import abi28_0_0.host.exp.exponent.modules.api.MediaLibraryModule;
import abi28_0_0.host.exp.exponent.modules.api.print.PrintModule;
import abi28_0_0.host.exp.exponent.modules.api.UpdatesModule;
import abi28_0_0.host.exp.exponent.modules.api.av.video.VideoManager;
import abi28_0_0.host.exp.exponent.modules.api.components.barcodescanner.BarCodeScannerModule;
import abi28_0_0.host.exp.exponent.modules.api.components.barcodescanner.BarCodeScannerViewManager;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.FaceDetectorModule;
import abi28_0_0.host.exp.exponent.modules.api.sensors.AccelerometerModule;
import abi28_0_0.host.exp.exponent.modules.api.AmplitudeModule;
import abi28_0_0.host.exp.exponent.modules.api.CalendarModule;
import abi28_0_0.host.exp.exponent.modules.api.ConstantsModule;
import abi28_0_0.host.exp.exponent.modules.api.ContactsModule;
import abi28_0_0.host.exp.exponent.modules.api.CryptoModule;
import abi28_0_0.host.exp.exponent.modules.api.DocumentPickerModule;
import abi28_0_0.host.exp.exponent.modules.api.ErrorRecoveryModule;
import abi28_0_0.host.exp.exponent.modules.api.FabricModule;
import abi28_0_0.host.exp.exponent.modules.api.FacebookModule;
import abi28_0_0.host.exp.exponent.modules.api.FileSystemModule;
import abi28_0_0.host.exp.exponent.modules.api.FingerprintModule;
import abi28_0_0.host.exp.exponent.modules.api.FontLoaderModule;
import abi28_0_0.host.exp.exponent.modules.api.GoogleModule;
import abi28_0_0.host.exp.exponent.modules.api.sensors.DeviceMotionModule;
import abi28_0_0.host.exp.exponent.modules.api.sensors.GyroscopeModule;
import abi28_0_0.host.exp.exponent.modules.api.ImageCropperModule;
import abi28_0_0.host.exp.exponent.modules.api.ImagePickerModule;
import abi28_0_0.host.exp.exponent.modules.api.KeepAwakeModule;
import abi28_0_0.host.exp.exponent.modules.api.KeyboardModule;
import abi28_0_0.host.exp.exponent.modules.api.LocationModule;
import abi28_0_0.host.exp.exponent.modules.api.LocalizationModule;
import abi28_0_0.host.exp.exponent.modules.api.NotificationsModule;
import abi28_0_0.host.exp.exponent.modules.api.PedometerModule;
import abi28_0_0.host.exp.exponent.modules.api.PermissionsModule;
import abi28_0_0.host.exp.exponent.modules.api.RNViewShotModule;
import abi28_0_0.host.exp.exponent.modules.api.SQLiteModule;
import abi28_0_0.host.exp.exponent.modules.api.ScreenOrientationModule;
import abi28_0_0.host.exp.exponent.modules.api.SegmentModule;
import abi28_0_0.host.exp.exponent.modules.api.ShakeModule;
import abi28_0_0.host.exp.exponent.modules.api.SpeechModule;
import abi28_0_0.host.exp.exponent.modules.api.URLHandlerModule;
import abi28_0_0.host.exp.exponent.modules.api.WebBrowserModule;
import abi28_0_0.host.exp.exponent.modules.api.av.AVModule;
import abi28_0_0.host.exp.exponent.modules.api.av.video.VideoViewManager;
import abi28_0_0.host.exp.exponent.modules.api.cognito.RNAWSCognitoModule;
import abi28_0_0.host.exp.exponent.modules.api.components.LinearGradientManager;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.CameraModule;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.CameraViewManager;
import abi28_0_0.host.exp.exponent.modules.api.components.lottie.LottiePackage;
import abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerPackage;
import abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule;
import abi28_0_0.host.exp.exponent.modules.api.components.maps.MapsPackage;
import abi28_0_0.host.exp.exponent.modules.api.components.svg.SvgPackage;
import abi28_0_0.host.exp.exponent.modules.api.fbads.AdSettingsManager;
import abi28_0_0.host.exp.exponent.modules.api.fbads.BannerViewManager;
import abi28_0_0.host.exp.exponent.modules.api.fbads.InterstitialAdManager;
import abi28_0_0.host.exp.exponent.modules.api.fbads.NativeAdManager;
import abi28_0_0.host.exp.exponent.modules.api.fbads.NativeAdViewManager;
import abi28_0_0.host.exp.exponent.modules.api.gl.GLObjectManagerModule;
import abi28_0_0.host.exp.exponent.modules.api.gl.GLViewManager;
import abi28_0_0.host.exp.exponent.modules.api.IntentLauncherModule;
import abi28_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedModule;
import abi28_0_0.host.exp.exponent.modules.api.SecureStoreModule;
import abi28_0_0.host.exp.exponent.modules.api.sensors.MagnetometerModule;
import abi28_0_0.host.exp.exponent.modules.api.sensors.MagnetometerUncalibratedModule;
import abi28_0_0.host.exp.exponent.modules.api.standalone.branch.RNBranchModule;
import abi28_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import abi28_0_0.host.exp.exponent.modules.internal.ExponentIntentModule;
import abi28_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;
import abi28_0_0.host.exp.exponent.modules.api.components.payments.StripeModule;
import abi28_0_0.host.exp.exponent.modules.test.ExponentTestNativeModule;

import static host.exp.exponent.kernel.KernelConstants.LINKING_URI_KEY;

public class ExponentPackage implements ReactPackage {

  private static final String TAG = ExponentPackage.class.getSimpleName();

  private final boolean mIsKernel;
  private final Map<String, Object> mExperienceProperties;
  private final JSONObject mManifest;

  private ExponentPackage(boolean isKernel, Map<String, Object> experienceProperties, JSONObject manifest) {
    mIsKernel = isKernel;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
  }

  public ExponentPackage(Map<String, Object> experienceProperties, JSONObject manifest) {
    mIsKernel = false;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
  }

  public static ExponentPackage kernelExponentPackage(JSONObject manifest) {
    Map<String, Object> kernelExperienceProperties = new HashMap<>();
    kernelExperienceProperties.put(LINKING_URI_KEY, "exp://");
    return new ExponentPackage(true, kernelExperienceProperties, manifest);
  }


  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    boolean isVerified = false;
    if (mManifest != null) {
      isVerified = mManifest.optBoolean(ExponentManifest.MANIFEST_IS_VERIFIED_KEY);
    }

    List<NativeModule> nativeModules = new ArrayList<>(Arrays.<NativeModule>asList(
        new URLHandlerModule(reactContext),
        new ConstantsModule(reactContext, mExperienceProperties, mManifest),
        new ShakeModule(reactContext),
        new FontLoaderModule(reactContext),
        new KeyboardModule(reactContext),
        new UpdatesModule(reactContext, mExperienceProperties, mManifest),
        new ExponentIntentModule(reactContext, mExperienceProperties)
    ));

    if (mIsKernel) {
      // Never need this in versioned code. Comment this out if this is in an abi package
      // nativeModules.add((NativeModule) ExponentKernelModuleProvider.newInstance(reactContext));
    }

    if (isVerified) {
      try {
        ExperienceId experienceId = ExperienceId.create(mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
        ScopedContext scopedContext = new ScopedContext(reactContext, experienceId.getUrlEncoded());

        nativeModules.add(new ExponentAsyncStorageModule(reactContext, mManifest));
        nativeModules.add(new AccelerometerModule(reactContext, experienceId));
        nativeModules.add(new GyroscopeModule(reactContext, experienceId));
        nativeModules.add(new MagnetometerModule(reactContext, experienceId));
        nativeModules.add(new DeviceMotionModule(reactContext, experienceId));
        nativeModules.add(new MagnetometerUncalibratedModule(reactContext, experienceId));
        nativeModules.add(new NotificationsModule(reactContext, mManifest, mExperienceProperties));
        nativeModules.add(new ContactsModule(reactContext, experienceId));
        nativeModules.add(new FileSystemModule(reactContext, scopedContext, mExperienceProperties));
        nativeModules.add(new LocationModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new CryptoModule(reactContext));
        nativeModules.add(new ImagePickerModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new ImageManipulatorModule(reactContext, scopedContext));
        nativeModules.add(new FacebookModule(reactContext));
        nativeModules.add(new FabricModule(reactContext, mExperienceProperties));
        nativeModules.add(new FingerprintModule(reactContext));
        nativeModules.add(new GoogleModule(reactContext, mExperienceProperties));
        nativeModules.add(new PermissionsModule(reactContext, experienceId, mManifest));
        nativeModules.add(new AmplitudeModule(reactContext, scopedContext));
        nativeModules.add(new SegmentModule(reactContext, scopedContext));
        nativeModules.add(new CameraModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new FaceDetectorModule(reactContext, scopedContext));
        nativeModules.add(new RNViewShotModule(reactContext, scopedContext));
        nativeModules.add(new KeepAwakeModule(reactContext));
        nativeModules.add(new ExponentTestNativeModule(reactContext));
        nativeModules.add(new WebBrowserModule(reactContext));
        nativeModules.add(new AVModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new VideoManager(reactContext));
        nativeModules.add(new NativeAdManager(reactContext));
        nativeModules.add(new AdSettingsManager(reactContext));
        nativeModules.add(new InterstitialAdManager(reactContext));
        nativeModules.add(new SQLiteModule(reactContext, scopedContext));
        nativeModules.add(new DocumentPickerModule(reactContext, scopedContext));
        nativeModules.add(new PedometerModule(reactContext));
        nativeModules.add(new RNBranchModule(reactContext));
        nativeModules.add(new ErrorRecoveryModule(reactContext, experienceId));
        nativeModules.add(new IntentLauncherModule(reactContext));
        nativeModules.add(new ScreenOrientationModule(reactContext));
        nativeModules.add(new SpeechModule(reactContext));
        nativeModules.add(new SecureStoreModule(reactContext, scopedContext));
        nativeModules.add(new GLObjectManagerModule(reactContext, scopedContext));
        nativeModules.add(new BrightnessModule(reactContext));
        nativeModules.add(new RNGestureHandlerModule(reactContext));
        nativeModules.add(new StripeModule(reactContext));
        nativeModules.add(new BarCodeScannerModule(reactContext));
        nativeModules.add(new RNAWSCognitoModule(reactContext));
        nativeModules.add(new MailComposerModule(reactContext));
        nativeModules.add(new CalendarModule(reactContext, experienceId));
        nativeModules.add(new MediaLibraryModule(reactContext, experienceId));
        nativeModules.add(new PrintModule(reactContext, scopedContext));
        nativeModules.add(new LocalizationModule(reactContext));
        nativeModules.add(new ReanimatedModule(reactContext));
      } catch (JSONException | UnsupportedEncodingException e) {
        EXL.e(TAG, e.toString());
      }
    } else {
      nativeModules.add(new ExponentUnsignedAsyncStorageModule(reactContext));
    }
    nativeModules.add(new ImageCropperModule(reactContext));

    return nativeModules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> viewManagers = new ArrayList<>(Arrays.<ViewManager>asList(
        new LinearGradientManager(),
        new VideoViewManager(),
        new CameraViewManager(),
        new GLViewManager(),
        new NativeAdViewManager(),
        new BarCodeScannerViewManager(),
        new BannerViewManager()
    ));

    // Add view manager from 3rd party library packages.
    addViewManagersFromPackages(reactContext, viewManagers, Arrays.<ReactPackage>asList(
      new SvgPackage(),
      new MapsPackage(),
      new LottiePackage(),
      new RNGestureHandlerPackage()
    ));

    return viewManagers;
  }

  private void addViewManagersFromPackages(ReactApplicationContext reactContext,
                                           List<ViewManager> viewManagers,
                                           List<ReactPackage> packages) {
    for (ReactPackage pack : packages) {
      viewManagers.addAll(pack.createViewManagers(reactContext));
    }
  }
}
