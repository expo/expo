package expo.modules.firebase.fabric.crashlytics;

import android.content.Context;
import android.util.Log;

import com.crashlytics.android.Crashlytics;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;

public class FirebaseCrashlyticsModule extends ExportedModule implements ModuleRegistryConsumer {

  private static final String TAG = FirebaseCrashlyticsModule.class.getCanonicalName();

  private ModuleRegistry mModuleRegistry;

  public FirebaseCrashlyticsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseCrashlytics";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void crash(Promise promise) {
    Crashlytics.getInstance().crash();
    promise.resolve(null);
  }

  @ExpoMethod
  public void log(final String message, Promise promise) {
    Crashlytics.log(message);
    promise.resolve(null);
  }

  @ExpoMethod
  public void recordError(final int code, final String domain, Promise promise) {
    Crashlytics.logException(new Exception(code + ": " + domain));
    promise.resolve(null);
  }

  @ExpoMethod
  public void setBoolValue(final String key, final boolean boolValue, Promise promise) {
    Crashlytics.setBool(key, boolValue);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setFloatValue(final String key, final float floatValue, Promise promise) {
    Crashlytics.setFloat(key, floatValue);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setIntValue(final String key, final int intValue, Promise promise) {
    Crashlytics.setInt(key, intValue);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setStringValue(final String key, final String stringValue, Promise promise) {
    Crashlytics.setString(key, stringValue);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setUserIdentifier(String userId, Promise promise) {
    Crashlytics.setUserIdentifier(userId);
    promise.resolve(null);
  }

}
