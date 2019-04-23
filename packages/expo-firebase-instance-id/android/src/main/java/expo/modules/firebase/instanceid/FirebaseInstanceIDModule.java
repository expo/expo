package expo.modules.firebase.instanceid;

import android.app.Activity;
import android.content.Context;
import android.util.Log;

import com.google.firebase.iid.FirebaseInstanceId;

import java.io.IOException;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;

public class FirebaseInstanceIDModule extends ExportedModule implements ModuleRegistryConsumer {

  private static final String TAG = FirebaseInstanceIDModule.class.getCanonicalName();

  public FirebaseInstanceIDModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseInstanceID";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
  }

  @ExpoMethod
  public void delete(Promise promise) {
    try {
      Log.d(TAG, "Deleting instance id");
      FirebaseInstanceId.getInstance().deleteInstanceId();
      promise.resolve(null);
    } catch (IOException e) {
      Log.e(TAG, e.getMessage());
      promise.reject("instance_id_error", e.getMessage());
    }
  }

  @ExpoMethod
  public void get(Promise promise) {
    String id = FirebaseInstanceId.getInstance().getId();
    promise.resolve(id);
  }

  @ExpoMethod
  public void getToken(String authorizedEntity, String scope, Promise promise) {
    try {
      String token = FirebaseInstanceId.getInstance().getToken(authorizedEntity, scope);
      Log.d(TAG, "Firebase token for " + authorizedEntity + ": " + token);
      promise.resolve(token);
    } catch (IOException e) {
      promise.reject("iid/request-failed", "getToken request failed", e);
    }
  }

  @ExpoMethod
  public void deleteToken(String authorizedEntity, String scope, Promise promise) {
    try {
      FirebaseInstanceId.getInstance().deleteToken(authorizedEntity, scope);
      Log.d(TAG, "Firebase token deleted for " + authorizedEntity);
      promise.resolve(null);
    } catch (IOException e) {
      promise.reject("iid/request-failed", "deleteToken request failed", e);
    }
  }
}
