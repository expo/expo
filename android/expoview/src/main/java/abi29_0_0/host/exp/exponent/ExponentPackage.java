// Copyright 2015-present 650 Industries. All rights reserved.

package abi29_0_0.host.exp.exponent;

import abi29_0_0.com.facebook.react.ReactPackage;
import abi29_0_0.com.facebook.react.bridge.NativeModule;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import abi29_0_0.expo.adapters.react.ReactModuleRegistryProvider;
import abi29_0_0.expo.core.interfaces.Package;
import abi29_0_0.expo.modules.camera.CameraPackage;
import abi29_0_0.expo.modules.constants.ConstantsPackage;
import abi29_0_0.expo.modules.facedetector.FaceDetectorPackage;
import abi29_0_0.expo.modules.filesystem.FileSystemPackage;
import abi29_0_0.expo.modules.gl.GLPackage;
import abi29_0_0.expo.modules.permissions.PermissionsPackage;
import abi29_0_0.expo.modules.sensors.SensorsPackage;
import abi29_0_0.expo.modules.sms.SMSPackage;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.utils.ScopedContext;
import abi29_0_0.host.exp.exponent.modules.api.SplashScreenModule;
import abi29_0_0.host.exp.exponent.modules.api.BrightnessModule;
import abi29_0_0.host.exp.exponent.modules.api.ImageManipulatorModule;
import abi29_0_0.host.exp.exponent.modules.api.MailComposerModule;
import abi29_0_0.host.exp.exponent.modules.api.MediaLibraryModule;
import abi29_0_0.host.exp.exponent.modules.api.PedometerModule;
import abi29_0_0.host.exp.exponent.modules.api.UpdatesModule;
import abi29_0_0.host.exp.exponent.modules.api.av.video.VideoManager;
import abi29_0_0.host.exp.exponent.modules.api.fbads.AdIconViewManager;
import abi29_0_0.host.exp.exponent.modules.api.fbads.MediaViewManager;
import abi29_0_0.host.exp.exponent.modules.api.print.PrintModule;
import abi29_0_0.host.exp.exponent.modules.api.components.barcodescanner.BarCodeScannerModule;
import abi29_0_0.host.exp.exponent.modules.api.components.barcodescanner.BarCodeScannerViewManager;
import abi29_0_0.host.exp.exponent.modules.api.AmplitudeModule;
import abi29_0_0.host.exp.exponent.modules.api.CalendarModule;
import abi29_0_0.host.exp.exponent.modules.api.ContactsModule;
import abi29_0_0.host.exp.exponent.modules.api.CryptoModule;
import abi29_0_0.host.exp.exponent.modules.api.DocumentPickerModule;
import abi29_0_0.host.exp.exponent.modules.api.ErrorRecoveryModule;
import abi29_0_0.host.exp.exponent.modules.api.FabricModule;
import abi29_0_0.host.exp.exponent.modules.api.FacebookModule;
import abi29_0_0.host.exp.exponent.modules.api.FingerprintModule;
import abi29_0_0.host.exp.exponent.modules.api.FontLoaderModule;
import abi29_0_0.host.exp.exponent.modules.api.GoogleModule;
import abi29_0_0.host.exp.exponent.modules.api.ImageCropperModule;
import abi29_0_0.host.exp.exponent.modules.api.ImagePickerModule;
import abi29_0_0.host.exp.exponent.modules.api.KeepAwakeModule;
import abi29_0_0.host.exp.exponent.modules.api.KeyboardModule;
import abi29_0_0.host.exp.exponent.modules.api.LocationModule;
import abi29_0_0.host.exp.exponent.modules.api.LocalizationModule;
import abi29_0_0.host.exp.exponent.modules.api.NotificationsModule;
import abi29_0_0.host.exp.exponent.modules.api.RNViewShotModule;
import abi29_0_0.host.exp.exponent.modules.api.SQLiteModule;
import abi29_0_0.host.exp.exponent.modules.api.ScreenOrientationModule;
import abi29_0_0.host.exp.exponent.modules.api.SegmentModule;
import abi29_0_0.host.exp.exponent.modules.api.ShakeModule;
import abi29_0_0.host.exp.exponent.modules.api.SpeechModule;
import abi29_0_0.host.exp.exponent.modules.api.URLHandlerModule;
import abi29_0_0.host.exp.exponent.modules.api.WebBrowserModule;
import abi29_0_0.host.exp.exponent.modules.api.av.AVModule;
import abi29_0_0.host.exp.exponent.modules.api.av.video.VideoViewManager;
import abi29_0_0.host.exp.exponent.modules.api.cognito.RNAWSCognitoModule;
import abi29_0_0.host.exp.exponent.modules.api.components.LinearGradientManager;
import abi29_0_0.host.exp.exponent.modules.api.components.lottie.LottiePackage;
import abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerPackage;
import abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule;
import abi29_0_0.host.exp.exponent.modules.api.components.maps.MapsPackage;
import abi29_0_0.host.exp.exponent.modules.api.components.svg.SvgPackage;
import abi29_0_0.host.exp.exponent.modules.api.fbads.AdSettingsManager;
import abi29_0_0.host.exp.exponent.modules.api.fbads.BannerViewManager;
import abi29_0_0.host.exp.exponent.modules.api.fbads.InterstitialAdManager;
import abi29_0_0.host.exp.exponent.modules.api.fbads.NativeAdManager;
import abi29_0_0.host.exp.exponent.modules.api.fbads.NativeAdViewManager;
import abi29_0_0.host.exp.exponent.modules.api.IntentLauncherModule;
import abi29_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedModule;
import abi29_0_0.host.exp.exponent.modules.api.SecureStoreModule;
import abi29_0_0.host.exp.exponent.modules.api.standalone.branch.RNBranchModule;
import abi29_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import abi29_0_0.host.exp.exponent.modules.internal.ExponentIntentModule;
import abi29_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;
import abi29_0_0.host.exp.exponent.modules.api.components.payments.StripeModule;
import abi29_0_0.host.exp.exponent.modules.test.ExponentTestNativeModule;
import abi29_0_0.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;
import abi29_0_0.host.exp.exponent.modules.universal.ScopedModuleRegistryAdapter;

import static host.exp.exponent.kernel.KernelConstants.LINKING_URI_KEY;

public class ExponentPackage implements ReactPackage {
  private static final List<Package> EXPO_MODULES_PACKAGES = Arrays.<Package>asList(
      new CameraPackage(),
      new SensorsPackage(),
      new FileSystemPackage(),
      new FaceDetectorPackage(),
      new ConstantsPackage(),
      new GLPackage(),
      new PermissionsPackage(),
      new SMSPackage()
  );

  private static final String TAG = ExponentPackage.class.getSimpleName();

  private final boolean mIsKernel;
  private final Map<String, Object> mExperienceProperties;
  private final JSONObject mManifest;

  private final ScopedModuleRegistryAdapter mModuleRegistryAdapter;

  private ExponentPackage(boolean isKernel, Map<String, Object> experienceProperties, JSONObject manifest) {
    mIsKernel = isKernel;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;
    mModuleRegistryAdapter = createDefaultModuleRegistryAdapterForPackages(EXPO_MODULES_PACKAGES);
  }

  public ExponentPackage(Map<String, Object> experienceProperties, JSONObject manifest, List<Package> expoPackages, ExponentPackageDelegate delegate) {
    mIsKernel = false;
    mExperienceProperties = experienceProperties;
    mManifest = manifest;

    List<Package> packages = new ArrayList<>(EXPO_MODULES_PACKAGES);
    if (expoPackages != null) {
      packages.addAll(expoPackages);
    }
    // Delegate may not be null only when the app is detached
    if (delegate != null) {
      mModuleRegistryAdapter = delegate.getScopedModuleRegistryAdapterForPackages(packages);
    } else {
      mModuleRegistryAdapter = createDefaultModuleRegistryAdapterForPackages(packages);
    }
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

    nativeModules.add(new ImageCropperModule(reactContext));

    if (isVerified) {
      try {
        ExperienceId experienceId = ExperienceId.create(mManifest.getString(ExponentManifest.MANIFEST_ID_KEY));
        ScopedContext scopedContext = new ScopedContext(reactContext, experienceId.getUrlEncoded());

        nativeModules.add(new ExponentAsyncStorageModule(reactContext, mManifest));
        nativeModules.add(new NotificationsModule(reactContext, mManifest, mExperienceProperties));
        nativeModules.add(new ContactsModule(reactContext, experienceId));
        nativeModules.add(new LocationModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new CryptoModule(reactContext));
        nativeModules.add(new ImagePickerModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new ImageManipulatorModule(reactContext, scopedContext));
        nativeModules.add(new FacebookModule(reactContext));
        nativeModules.add(new FabricModule(reactContext, mExperienceProperties));
        nativeModules.add(new FingerprintModule(reactContext));
        nativeModules.add(new GoogleModule(reactContext, mExperienceProperties));
        nativeModules.add(new AmplitudeModule(reactContext, scopedContext));
        nativeModules.add(new SegmentModule(reactContext, scopedContext));
        nativeModules.add(new RNViewShotModule(reactContext, scopedContext));
        nativeModules.add(new KeepAwakeModule(reactContext));
        nativeModules.add(new ExponentTestNativeModule(reactContext));
        nativeModules.add(new WebBrowserModule(reactContext));
        nativeModules.add(new AVModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new VideoManager(reactContext));
        nativeModules.add(new NativeAdManager(reactContext));
        nativeModules.add(new AdSettingsManager(reactContext));
        nativeModules.add(new InterstitialAdManager(reactContext));
        nativeModules.add(new PedometerModule(reactContext));
        nativeModules.add(new SQLiteModule(reactContext, scopedContext));
        nativeModules.add(new DocumentPickerModule(reactContext, scopedContext));
        nativeModules.add(new RNBranchModule(reactContext));
        nativeModules.add(new ErrorRecoveryModule(reactContext, experienceId));
        nativeModules.add(new IntentLauncherModule(reactContext));
        nativeModules.add(new ScreenOrientationModule(reactContext));
        nativeModules.add(new SpeechModule(reactContext));
        nativeModules.add(new SecureStoreModule(reactContext, scopedContext));
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
        nativeModules.add(new SplashScreenModule(reactContext, experienceId));

        // Call to create native modules has to be at the bottom --
        // -- ExpoModuleRegistryAdapter uses the list of native modules
        // to create Bindings for internal modules.
        nativeModules.addAll(mModuleRegistryAdapter.createNativeModules(scopedContext, experienceId, mExperienceProperties, mManifest, nativeModules));
      } catch (JSONException | UnsupportedEncodingException e) {
        EXL.e(TAG, e.toString());
      }
    } else {
      nativeModules.add(new ExponentUnsignedAsyncStorageModule(reactContext));
    }

    return nativeModules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> viewManagers = new ArrayList<>(Arrays.<ViewManager>asList(
        new LinearGradientManager(),
        new VideoViewManager(),
        new NativeAdViewManager(),
        new BarCodeScannerViewManager(),
        new BannerViewManager(),
        new MediaViewManager(),
        new AdIconViewManager()
    ));

    // Add view manager from 3rd party library packages.
    addViewManagersFromPackages(reactContext, viewManagers, Arrays.<ReactPackage>asList(
      new SvgPackage(),
      new MapsPackage(),
      new LottiePackage(),
      new RNGestureHandlerPackage()
    ));

    viewManagers.addAll(mModuleRegistryAdapter.createViewManagers(reactContext));

    return viewManagers;
  }

  private void addViewManagersFromPackages(ReactApplicationContext reactContext,
                                           List<ViewManager> viewManagers,
                                           List<ReactPackage> packages) {
    for (ReactPackage pack : packages) {
      viewManagers.addAll(pack.createViewManagers(reactContext));
    }
  }

  private ExpoModuleRegistryAdapter createDefaultModuleRegistryAdapterForPackages(List<Package> packages) {
    return new ExpoModuleRegistryAdapter(new ReactModuleRegistryProvider(packages));
  }
}
