// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Debug;
import androidx.core.content.ContextCompat;
import android.view.View;

import com.facebook.react.ReactRootView;
import com.facebook.soloader.SoLoader;
import com.squareup.leakcanary.LeakCanary;

import org.unimodules.core.interfaces.Package;

import java.util.Arrays;
import java.util.List;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import expo.modules.analytics.amplitude.AmplitudePackage;
import expo.modules.barcodescanner.BarCodeScannerPackage;
import expo.modules.camera.CameraPackage;
import expo.modules.constants.ConstantsPackage;
import expo.modules.device.DevicePackage;
import expo.modules.facedetector.FaceDetectorPackage;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.font.FontLoaderPackage;
import expo.modules.keepawake.KeepAwakePackage;
import expo.modules.medialibrary.MediaLibraryPackage;
import expo.modules.notifications.NotificationsPackage;
import expo.modules.permissions.PermissionsPackage;
import expo.modules.splashscreen.SplashScreen;
import expo.modules.splashscreen.SplashScreenImageResizeMode;
import expo.modules.splashscreen.SplashScreenPackage;
import expo.modules.taskManager.TaskManagerPackage;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.utils.ExperienceActivityUtils;
import host.exp.expoview.BuildConfig;

public class HomeActivity extends BaseExperienceActivity {

  @Inject
  ExponentManifest mExponentManifest;

  //region Activity Lifecycle

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    NativeModuleDepsProvider.getInstance().inject(HomeActivity.class, this);

    mSDKVersion = RNObject.UNVERSIONED;
    mManifest = mExponentManifest.getKernelManifest();
    mExperienceId = ExperienceId.create(mManifest.optString(ExponentManifest.MANIFEST_ID_KEY));

    ExperienceActivityUtils.overrideUserInterfaceStyle(mExponentManifest.getKernelManifest(), this);
    ExperienceActivityUtils.configureStatusBar(mExponentManifest.getKernelManifest(), this);

    EventBus.getDefault().registerSticky(this);
    mKernel.startJSKernel(this);

    SplashScreen.show(this, SplashScreenImageResizeMode.NATIVE, ReactRootView.class, true);

    tryInstallLeakCanary(true);
  }

  @Override
  protected boolean shouldCreateLadingView() {
    return false;
  }

  @Override
  protected void onResume() {
    super.onResume();

    SoLoader.init(this, false);

    Analytics.logEvent("HOME_APPEARED");

    registerForNotifications();
  }

  //endregion Activity Lifecycle

  /**
   * This method has been split out from onDestroy lifecycle method to {@link ReactNativeActivity#destroyReactInstanceManager()}
   * and overridden here as we want to prevent destroying react instance manager when HomeActivity gets destroyed.
   * It needs to continue to live since it is needed for DevMenu to work as expected (it relies on ExponentKernelModule from that react context).
   */
  @Override
  protected void destroyReactInstanceManager() {}

  private void tryInstallLeakCanary(boolean shouldAskForPermissions) {
    if (BuildConfig.DEBUG && Constants.ENABLE_LEAK_CANARY) {
      // Leak canary needs WRITE_EXTERNAL_STORAGE permission
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (shouldAskForPermissions && ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
          requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 1248919246);
        } else {
          LeakCanary.install(getApplication());
        }
      } else {
        LeakCanary.install(getApplication());
      }
    }
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);

    tryInstallLeakCanary(false);
  }

  public void onEventMainThread(Kernel.KernelStartedRunningEvent event) {
    mReactInstanceManager.assign(mKernel.getReactInstanceManager());
    mReactRootView.assign(mKernel.getReactRootView());
    mReactInstanceManager.onHostResume(this, this);
    setReactRootView((View) mReactRootView.get());
    finishLoading();

    if (Constants.DEBUG_COLD_START_METHOD_TRACING) {
      Debug.stopMethodTracing();
    }
  }

  @Override
  protected void onError(final Intent intent) {
    intent.putExtra(ErrorActivity.IS_HOME_KEY, true);
    mKernel.setHasError();
  }

  public static List<Package> homeExpoPackages() {
    return Arrays.<Package>asList(
        new ConstantsPackage(),
        new PermissionsPackage(),
        new FileSystemPackage(),
        new FontLoaderPackage(),
        new BarCodeScannerPackage(),
        new KeepAwakePackage(),
        new AmplitudePackage(),
        new CameraPackage(),
        new FaceDetectorPackage(),
        new MediaLibraryPackage(),
        new NotificationsPackage(), // home doesn't use notifications, but we want the singleton modules created
        new TaskManagerPackage(), // load expo-task-manager to restore tasks once the client is opened
        new DevicePackage(),
        new SplashScreenPackage()
    );
  }
}
