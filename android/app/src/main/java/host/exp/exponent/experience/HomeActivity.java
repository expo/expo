// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Debug;
import android.support.v4.content.ContextCompat;
import android.view.View;

import com.amplitude.api.Amplitude;
import com.squareup.leakcanary.LeakCanary;

import de.greenrobot.event.EventBus;
import host.exp.exponentview.BuildConfig;
import host.exp.exponent.Constants;
import host.exp.exponent.kernel.Kernel;

import com.facebook.soloader.SoLoader;

public class HomeActivity extends BaseExperienceActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mShouldDestroyRNInstanceOnExit = false;

    EventBus.getDefault().registerSticky(this);
    mKernel.startJSKernel();
    showLoadingScreen(null);

    if (BuildConfig.DEBUG && Constants.ENABLE_LEAK_CANARY) {
      // Leak canary needs WRITE_EXTERNAL_STORAGE permission
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
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

    LeakCanary.install(getApplication());
  }

  @Override
  protected void onResume() {
    super.onResume();

    SoLoader.init(this, false);

    Amplitude.getInstance().logEvent("HOME_APPEARED");

    registerForNotifications();
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    EventBus.getDefault().unregister(this);
  }

  public void onEventMainThread(Kernel.KernelStartedRunningEvent event) {
    mReactInstanceManager.assign(mKernel.getReactInstanceManager());
    mReactRootView.assign(mKernel.getReactRootView());
    mReactInstanceManager.onHostResume(this, this);
    setView((View) mReactRootView.get());

    if (Constants.DEBUG_COLD_START_METHOD_TRACING) {
      Debug.stopMethodTracing();
    }
  }

  @Override
  protected void onError(final Intent intent) {
    intent.putExtra(ErrorActivity.IS_HOME_KEY, true);
    mKernel.setHasError();
  }
}
