-keepclassmembers class com.facebook.react.ReactInstanceManager {
  private final com.facebook.react.bridge.JSBundleLoader mBundleLoader;
}

-keepclassmembers class com.facebook.react.devsupport.ReleaseDevSupportManager {
  private final com.facebook.react.bridge.JSExceptionHandler defaultJSExceptionHandler;
}

# Workaround zstd-kmp R8 issue - https://github.com/square/zstd-kmp/issues/108
-keep class com.squareup.zstd.** { *; }
