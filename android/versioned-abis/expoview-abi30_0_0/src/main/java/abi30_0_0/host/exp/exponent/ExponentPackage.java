// Copyright 2015-present 650 Industries. All rights reserved.

package abi30_0_0.host.exp.exponent;

import abi30_0_0.com.facebook.react.ReactPackage;
import abi30_0_0.com.facebook.react.bridge.NativeModule;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import abi30_0_0.expo.adapters.react.ReactModuleRegistryProvider;
import abi30_0_0.expo.core.interfaces.Package;
import abi30_0_0.expo.modules.ads.admob.AdMobPackage;
import abi30_0_0.expo.modules.font.FontLoaderPackage;
import abi30_0_0.expo.modules.localauthentication.LocalAuthenticationPackage;
import abi30_0_0.expo.modules.payments.stripe.StripePackage;
import abi30_0_0.expo.modules.print.PrintPackage;
import abi30_0_0.expo.modules.analytics.segment.SegmentPackage;
import abi30_0_0.expo.modules.barcodescanner.BarCodeScannerPackage;
import abi30_0_0.expo.modules.camera.CameraPackage;
import abi30_0_0.expo.modules.constants.ConstantsPackage;
import abi30_0_0.expo.modules.contacts.ContactsPackage;
import abi30_0_0.expo.modules.facedetector.FaceDetectorPackage;
import abi30_0_0.expo.modules.filesystem.FileSystemPackage;
import abi30_0_0.expo.modules.gl.GLPackage;
import abi30_0_0.expo.modules.location.LocationPackage;
import abi30_0_0.expo.modules.medialibrary.MediaLibraryPackage;
import abi30_0_0.expo.modules.permissions.PermissionsPackage;
import abi30_0_0.expo.modules.sensors.SensorsPackage;
import abi30_0_0.expo.modules.sms.SMSPackage;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.utils.ScopedContext;
import abi30_0_0.host.exp.exponent.modules.api.SplashScreenModule;
import abi30_0_0.host.exp.exponent.modules.api.BrightnessModule;
import abi30_0_0.host.exp.exponent.modules.api.ImageManipulatorModule;
import abi30_0_0.host.exp.exponent.modules.api.MailComposerModule;
import abi30_0_0.host.exp.exponent.modules.api.PedometerModule;
import abi30_0_0.host.exp.exponent.modules.api.UpdatesModule;
import abi30_0_0.host.exp.exponent.modules.api.av.video.VideoManager;
import abi30_0_0.host.exp.exponent.modules.api.fbads.AdIconViewManager;
import abi30_0_0.host.exp.exponent.modules.api.fbads.MediaViewManager;
import abi30_0_0.host.exp.exponent.modules.api.AmplitudeModule;
import abi30_0_0.host.exp.exponent.modules.api.CalendarModule;
import abi30_0_0.host.exp.exponent.modules.api.CryptoModule;
import abi30_0_0.host.exp.exponent.modules.api.DocumentPickerModule;
import abi30_0_0.host.exp.exponent.modules.api.ErrorRecoveryModule;
import abi30_0_0.host.exp.exponent.modules.api.FabricModule;
import abi30_0_0.host.exp.exponent.modules.api.FacebookModule;
import abi30_0_0.host.exp.exponent.modules.api.GoogleModule;
import abi30_0_0.host.exp.exponent.modules.api.ImageCropperModule;
import abi30_0_0.host.exp.exponent.modules.api.ImagePickerModule;
import abi30_0_0.host.exp.exponent.modules.api.KeepAwakeModule;
import abi30_0_0.host.exp.exponent.modules.api.KeyboardModule;
import abi30_0_0.host.exp.exponent.modules.api.LocalizationModule;
import abi30_0_0.host.exp.exponent.modules.api.NotificationsModule;
import abi30_0_0.host.exp.exponent.modules.api.RNViewShotModule;
import abi30_0_0.host.exp.exponent.modules.api.SQLiteModule;
import abi30_0_0.host.exp.exponent.modules.api.ScreenOrientationModule;
import abi30_0_0.host.exp.exponent.modules.api.screens.RNScreenPackage;
import abi30_0_0.host.exp.exponent.modules.api.ShakeModule;
import abi30_0_0.host.exp.exponent.modules.api.SpeechModule;
import abi30_0_0.host.exp.exponent.modules.api.URLHandlerModule;
import abi30_0_0.host.exp.exponent.modules.api.WebBrowserModule;
import abi30_0_0.host.exp.exponent.modules.api.av.AVModule;
import abi30_0_0.host.exp.exponent.modules.api.av.video.VideoViewManager;
import abi30_0_0.host.exp.exponent.modules.api.cognito.RNAWSCognitoModule;
import abi30_0_0.host.exp.exponent.modules.api.components.LinearGradientManager;
import abi30_0_0.host.exp.exponent.modules.api.components.lottie.LottiePackage;
import abi30_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerPackage;
import abi30_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule;
import abi30_0_0.host.exp.exponent.modules.api.components.maps.MapsPackage;
import abi30_0_0.host.exp.exponent.modules.api.components.svg.SvgPackage;
import abi30_0_0.host.exp.exponent.modules.api.fbads.AdSettingsManager;
import abi30_0_0.host.exp.exponent.modules.api.fbads.BannerViewManager;
import abi30_0_0.host.exp.exponent.modules.api.fbads.InterstitialAdManager;
import abi30_0_0.host.exp.exponent.modules.api.fbads.NativeAdManager;
import abi30_0_0.host.exp.exponent.modules.api.fbads.NativeAdViewManager;
import abi30_0_0.host.exp.exponent.modules.api.IntentLauncherModule;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedModule;
import abi30_0_0.host.exp.exponent.modules.api.SecureStoreModule;
import abi30_0_0.host.exp.exponent.modules.api.standalone.branch.RNBranchModule;
import abi30_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule;
import abi30_0_0.host.exp.exponent.modules.internal.ExponentIntentModule;
import abi30_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule;
import abi30_0_0.host.exp.exponent.modules.test.ExponentTestNativeModule;
import abi30_0_0.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;
import abi30_0_0.host.exp.exponent.modules.universal.ScopedModuleRegistryAdapter;

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
      new SMSPackage(),
      new PrintPackage(),
      new MediaLibraryPackage(),
      new SegmentPackage(),
      new FontLoaderPackage(),
      new LocationPackage(),
      new ContactsPackage(),
      new BarCodeScannerPackage(),
      new AdMobPackage(),
      new StripePackage(),
      new LocalAuthenticationPackage()
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
        nativeModules.add(new CryptoModule(reactContext));
        nativeModules.add(new ImagePickerModule(reactContext, scopedContext, experienceId));
        nativeModules.add(new ImageManipulatorModule(reactContext, scopedContext));
        nativeModules.add(new FacebookModule(reactContext));
        nativeModules.add(new FabricModule(reactContext, mExperienceProperties));
        nativeModules.add(new GoogleModule(reactContext, mExperienceProperties));
        nativeModules.add(new AmplitudeModule(reactContext, scopedContext));
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
        nativeModules.add(new RNAWSCognitoModule(reactContext));
        nativeModules.add(new MailComposerModule(reactContext));
        nativeModules.add(new CalendarModule(reactContext, experienceId));
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
        new BannerViewManager(),
        new MediaViewManager(),
        new AdIconViewManager()
    ));

    // Add view manager from 3rd party library packages.
    addViewManagersFromPackages(reactContext, viewManagers, Arrays.<ReactPackage>asList(
      new SvgPackage(),
      new MapsPackage(),
      new LottiePackage(),
      new RNGestureHandlerPackage(),
      new RNScreenPackage()
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
