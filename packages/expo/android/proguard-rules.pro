# For ReactActivityDelegateWrapper
-keepclassmembers public class com.facebook.react.ReactActivityDelegate {
  protected *;
  private ReactDelegate mReactDelegate;
}
-keepclassmembers public class com.facebook.react.ReactActivity {
  private final ReactActivityDelegate mDelegate;
}

# For ReactNativeHostWrapper
-keepclassmembers public class com.facebook.react.ReactNativeHost {
  protected *;
}

# For ExpoModulesPackage autolinking
-keepclassmembers public class expo.modules.ExpoModulesPackageList {
  public *;
}

-keepnames class * extends expo.modules.core.BasePackage
-keepnames class * implements expo.modules.core.interfaces.Package
