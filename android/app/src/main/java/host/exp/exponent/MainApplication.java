package host.exp.exponent;

import com.facebook.react.ReactPackage;

import java.util.Arrays;
import java.util.List;

import expo.modules.ExpoModulesPackageList;
import expo.modules.apploader.AppLoaderPackagesProviderInterface;
import expo.modules.core.interfaces.Package;

// Needed for `react-native link`
// import com.facebook.react.ReactApplication;

public class MainApplication extends ExpoApplication implements AppLoaderPackagesProviderInterface<ReactPackage> {

  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }

  // Needed for `react-native link`
  public List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
      // Add your own packages here!
      // TODO: add native modules!

      // Needed for `react-native link`
      // new MainReactPackage()
    );
  }

  public List<Package> getExpoPackages() {
    return ExpoModulesPackageList.getPackageList();
  }
}
