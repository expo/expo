package com.testrunner;

import android.app.Application;
import android.content.res.Configuration;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import expo.interfaces.devmenu.DevMenuPreferencesInterface;
import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;
import expo.modules.devlauncher.DevLauncherController;
import expo.modules.devmenu.DevMenuDefaultPreferences;
import expo.modules.devmenu.DevMenuManager;
import expo.modules.devmenu.tests.DevMenuTestInterceptor;

import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost = new ReactNativeHostWrapper(
      this,
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          return new PackageList(this).getPackages();
        }

        @Override
        protected String getJSMainModuleName() {
          return ".expo/.virtual-metro-entry";
        }
      });

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);

    DevMenuManager.INSTANCE.setTestInterceptor(new DevMenuTestInterceptor() {
      @Nullable
      @Override
      public DevMenuPreferencesInterface overrideSettings() {
        return new DevMenuDefaultPreferences() {
          @Override
          public boolean getShowsAtLaunch() {
            return false;
          }

          @Override
          public boolean isOnboardingFinished() {
            return true;
          }
        };
      }
    });

    DevLauncherController.initialize(this, mReactNativeHost);


    ApplicationLifecycleDispatcher.onApplicationCreate(this);
  }

  @Override
  public void onConfigurationChanged(@NonNull Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }
}
