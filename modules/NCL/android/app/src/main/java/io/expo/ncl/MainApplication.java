package io.expo.ncl;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

import expo.adapters.react.ModuleRegistryAdapter;
import expo.adapters.react.ReactAdapterPackage;
import expo.core.ModuleRegistryProvider;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.sensors.SensorsPackage;
import expo.core.interfaces.Package;

public class MainApplication extends Application implements ReactApplication {
  private final ModuleRegistryProvider mModuleRegistryProvider = new ModuleRegistryProvider(Arrays.<Package>asList(
          new ReactAdapterPackage(),
          new SensorsPackage(),
          new FileSystemPackage()
          // more packages, like
          // new CameraPackage(), if you use expo-camera
          // etc.
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
              new ModuleRegistryAdapter(mModuleRegistryProvider)
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
