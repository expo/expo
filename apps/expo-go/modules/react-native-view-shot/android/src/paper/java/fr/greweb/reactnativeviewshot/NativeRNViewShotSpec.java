package fr.greweb.reactnativeviewshot;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public abstract class NativeRNViewShotSpec extends ReactContextBaseJavaModule implements TurboModule {
  public static final String NAME = "RNViewShot";

  public NativeRNViewShotSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public @Nonnull String getName() {
    return NAME;
  }

  @ReactMethod
  @DoNotStrip
  public abstract void releaseCapture(String uri);

  @ReactMethod
  @DoNotStrip
  public abstract void captureRef(@Nullable Double target, ReadableMap withOptions, Promise promise);

  @ReactMethod
  @DoNotStrip
  public abstract void captureScreen(ReadableMap options, Promise promise);
}
