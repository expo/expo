// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import android.app.Application;
import android.content.Context;
import android.content.pm.PackageManager;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.ExpoUpdatesAppLoader;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.expoview.ExpoViewBuildConfig;

public class ExpoViewKernel extends KernelInterface {

  public static class ExpoViewErrorEvent {

    public final String errorMessage;

    ExpoViewErrorEvent(final String errorMessage) {
      this.errorMessage = errorMessage;
    }
  }

  private static final String TAG = ExpoViewKernel.class.getSimpleName();

  private static ExpoViewKernel sInstance;
  private static String sVersionName;

  @Inject
  Context mContext;

  @Inject
  Application mApplicationContext;

  public static ExpoViewKernel getInstance() {
    if (sInstance == null) {
      sInstance = new ExpoViewKernel();
    }

    return sInstance;
  }

  private ExpoViewKernel() {
    NativeModuleDepsProvider.getInstance().inject(ExpoViewKernel.class, this);

    try {
      sVersionName = mApplicationContext.getPackageManager().getPackageInfo(mContext.getPackageName(), 0).versionName;
    } catch (PackageManager.NameNotFoundException e) {
      EXL.e(TAG, e);
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }

  public String getVersionName() {
    return sVersionName;
  }

  @Override
  public void handleError(String errorMessage) {
    if (ExpoViewBuildConfig.DEBUG) {
      EventBus.getDefault().post(new ExpoViewErrorEvent(errorMessage));
    } else {
      throw new RuntimeException(errorMessage);
    }
  }

  @Override
  public void handleError(Exception exception) {
    if (ExpoViewBuildConfig.DEBUG) {
      EventBus.getDefault().post(new ExpoViewErrorEvent(exception.toString()));
    } else {
      throw new RuntimeException(exception);
    }
  }

  @Override
  public void openExperience(KernelConstants.ExperienceOptions options) {

  }

  @Override
  public ExpoUpdatesAppLoader getAppLoaderForManifestUrl(String manifestUrl) {
    return null;
  }

  @Override
  public boolean reloadVisibleExperience(String manifestUrl, boolean forceCache) {
    return false;
  }
}
