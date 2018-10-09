package expo.modules.firebase.functions;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.functions.FirebaseFunctions;
import com.google.firebase.functions.FirebaseFunctionsException;
import com.google.firebase.functions.HttpsCallableReference;
import com.google.firebase.functions.HttpsCallableResult;

import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.modules.firebase.app.Utils;

public class FirebaseFunctionsModule extends ExportedModule implements ModuleRegistryConsumer {

  private static final String TAG = FirebaseFunctionsModule.class.getCanonicalName();

  private static final String DATA_KEY = "data";
  private static final String CODE_KEY = "code";
  private static final String MSG_KEY = "message";
  private static final String ERROR_KEY = "__error";
  private static final String DETAILS_KEY = "details";

  private ModuleRegistry mModuleRegistry;

  public FirebaseFunctionsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseFunctions";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  protected final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }


  @ExpoMethod
  public void httpsCallable(final String name, Map<String, Object> wrapper, final Promise promise) {
    Object input = wrapper.get(DATA_KEY);
    Log.d(TAG, "function:call:input:" + name + ":" + (input != null ? input.toString() : "null"));

    HttpsCallableReference httpsCallableReference = FirebaseFunctions
      .getInstance()
      .getHttpsCallable(name);

    httpsCallableReference
      .call(input)
      .addOnSuccessListener(new OnSuccessListener<HttpsCallableResult>() {
        @Override
        public void onSuccess(HttpsCallableResult httpsCallableResult) {
          Bundle map = new Bundle();
          Object result = httpsCallableResult.getData();

          Log.d(
            TAG,
            "function:call:onSuccess:" + name
          );
          Log.d(
            TAG,
            "function:call:onSuccess:result:type:" + name + ":" + (result != null ? result.getClass().getName() : "null")
          );
          Log.d(
            TAG,
            "function:call:onSuccess:result:data:" + name + ":" + (result != null ? result.toString() : "null")
          );

          Utils.mapPutValue(DATA_KEY, result, map);
          promise.resolve(map);

        }
      })
      .addOnFailureListener(new OnFailureListener() {
        @Override
        public void onFailure(@NonNull Exception exception) {
          Log.d(TAG, "function:call:onFailure:" + name, exception);

          String message;
          Object details = null;
          String code = "UNKNOWN";
          Bundle map = new Bundle();

          if (exception instanceof FirebaseFunctionsException) {
            FirebaseFunctionsException ffe = (FirebaseFunctionsException) exception;
            details = ffe.getDetails();
            code = ffe.getCode().name();
            message = ffe.getLocalizedMessage();
          } else {
            message = exception.getLocalizedMessage();
          }

          Utils.mapPutValue(CODE_KEY, code, map);
          Utils.mapPutValue(MSG_KEY, message, map);
          Utils.mapPutValue(ERROR_KEY, true, map);
          Utils.mapPutValue(DETAILS_KEY, details, map);
          promise.resolve(map);
        }
      });
  }
}
