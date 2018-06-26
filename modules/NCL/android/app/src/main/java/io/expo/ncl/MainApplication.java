package io.expo.ncl;

import android.support.multidex.MultiDexApplication;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

import expo.adapters.react.ModuleRegistryAdapter;
import expo.adapters.react.ReactAdapterPackage;
import expo.adapters.react.ReactModuleRegistryProvider;
import expo.core.ModuleRegistryProvider;
import expo.modules.camera.CameraPackage;
import expo.modules.constants.ConstantsPackage;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.gl.GLPackage;
import expo.modules.permissions.PermissionsPackage;
import expo.modules.sensors.SensorsPackage;
import expo.core.interfaces.Package;

public class MainApplication extends MultiDexApplication implements ReactApplication {
  private final ModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
          new ReactAdapterPackage(),
          new SensorsPackage(),
          new FileSystemPackage(),
          new PermissionsPackage(),
          new CameraPackage(),
          new GLPackage(),
          new ConstantsPackage()
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
