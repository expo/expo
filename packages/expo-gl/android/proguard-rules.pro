# Expo creates the view by reflection. `GLView` extends `TextureView`, so the `ExpoView` rule in expo-modules-core does not match it.
-keepclassmembers class expo.modules.gl.GLView {
  public <init>(android.content.Context, expo.modules.kotlin.AppContext);
}

# `EXGLContextPrepare` in the native code looks up `GLContext.flush()` by name through JNI.
-keepclassmembers class expo.modules.gl.GLContext {
  public void flush();
}
