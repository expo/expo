package expo.modules.benchmark;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import javax.annotation.Nonnull;

public abstract class NativeBenchmarkingTurboModuleSpec extends ReactContextBaseJavaModule implements TurboModule {
  public static final String NAME = "BenchmarkingTurboModule";

  public NativeBenchmarkingTurboModuleSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public @Nonnull String getName() {
    return NAME;
  }

  @ReactMethod
  @DoNotStrip
  public abstract void nothing();

  @ReactMethod(isBlockingSynchronousMethod = true)
  @DoNotStrip
  public abstract double addNumbers(double a, double b);

  @ReactMethod(isBlockingSynchronousMethod = true)
  @DoNotStrip
  public abstract String addStrings(String a, String b);

  @ReactMethod(isBlockingSynchronousMethod = true)
  @DoNotStrip
  public abstract double foldArray(ReadableArray array);
}
