package com.camersja;

import android.app.Application;

import com.facebook.react.ReactApplication;

import expo.adapters.react.ModuleRegistryWrapper;
import expo.adapters.react.ReactAdapterPackage;
import expo.core.ModuleRegistryBuilder;
import expo.core.Package;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.facedetector.FaceDetectorPackage;
import expo.modules.camera.CameraPackage;
import expo.modules.permissions.PermissionsPackage;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private final ModuleRegistryBuilder mModuleRegistryBuilder = new ModuleRegistryBuilder(Arrays.<Package>asList(
    new FileSystemPackage(),
    new FaceDetectorPackage(),
    new PermissionsPackage(),
    new CameraPackage(),
    new ReactAdapterPackage()
  ));

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
          new ModuleRegistryWrapper(mModuleRegistryBuilder)
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
