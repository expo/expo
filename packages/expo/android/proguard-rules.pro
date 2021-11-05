# For ReactNativeDelegateWrapper
-keepclassmembers public class com.facebook.react.ReactActivityDelegate {
  protected *;
  private ReactDelegate mReactDelegate;
}

# For ReactNativeHostWrapper
-keepclassmembers public class com.facebook.react.ReactNativeHost {
  protected *;
}
