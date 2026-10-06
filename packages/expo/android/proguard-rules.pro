# For ReactActivityDelegateWrapper
-keepclassmembers public class com.facebook.react.ReactActivityDelegate {
  public *;
  protected *;
  private ReactDelegate mReactDelegate;
}
# Remove this after react-native 0.74.1
-keepclassmembers public class expo.modules.ReactActivityDelegateWrapper {
  protected ReactDelegate getReactDelegate();
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

# For Expo Modules v2 autolinking. ExpoModulesV2Host loads this class by name.
-keep class expo.modules.ExpoModulesV2ModuleList {
  public <init>();
}

# For React Native WindowUtilKt edge-to-edge support
-keep class com.facebook.react.views.view.WindowUtilKt {
  *;
}

# Workaround zstd-kmp R8 issue - https://github.com/square/zstd-kmp/issues/108
-keep class com.squareup.zstd.** { *; }

# Workaround Fresco R8 issue - https://github.com/facebook/fresco/issues/2867
-keep class com.facebook.animated.gif.GifImageDecoder { public <init>(...); }
-keep class com.facebook.animated.webp.WebPImageDecoder { public <init>(...); }
