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

import com.facebook.soloader.SoLoader;
import com.squareup.leakcanary.LeakCanary;

import org.unimodules.core.interfaces.Package;

import java.util.Arrays;
import java.util.List;

import de.greenrobot.event.EventBus;
import expo.modules.analytics.amplitude.AmplitudePackage;
import expo.modules.barcodescanner.BarCodeScannerPackage;
import expo.modules.camera.CameraPackage;
import expo.modules.constants.ConstantsPackage;
import expo.modules.facedetector.FaceDetectorPackage;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.font.FontLoaderPackage;
import expo.modules.keepawake.KeepAwakePackage;
import expo.modules.medialibrary.MediaLibraryPackage;
import expo.modules.permissions.PermissionsPackage;
import expo.modules.taskManager.TaskManagerPackage;
import host.exp.exponent.Constants;
import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.kernel.Kernel;
import host.exp.expoview.BuildConfig;

public class HomeActivity extends BaseExperienceActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mShouldDestroyRNInstanceOnExit = false;
    mSDKVersion = RNObject.UNVERSIONED;

    EventBus.getDefault().registerSticky(this);
    mKernel.startJSKernel();
    showLoadingScreen(null);

    tryInstallLeakCanary(true);
  }

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

  @Override
  protected void onResume() {
    super.onResume();

    SoLoader.init(this, false);

    Analytics.logEvent("HOME_APPEARED");

    registerForNotifications();
  }

  public void onEventMainThread(Kernel.KernelStartedRunningEvent event) {
    mReactInstanceManager.assign(mKernel.getReactInstanceManager());
    mReactRootView.assign(mKernel.getReactRootView());
    mReactInstanceManager.onHostResume(this, this);
    setView((View) mReactRootView.get());
    checkForReactViews();

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
        new TaskManagerPackage() // load expo-task-manager to restore tasks once the client is opened
    );
  }
}
