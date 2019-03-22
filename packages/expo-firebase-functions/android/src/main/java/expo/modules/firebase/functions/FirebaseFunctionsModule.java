package expo.modules.firebase.functions;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.FirebaseApp;
import com.google.firebase.functions.FirebaseFunctions;
import com.google.firebase.functions.FirebaseFunctionsException;
import com.google.firebase.functions.HttpsCallableReference;
import com.google.firebase.functions.HttpsCallableResult;

import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import expo.modules.firebase.app.Utils;

public class FirebaseFunctionsModule extends ExportedModule implements ModuleRegistryConsumer {

  private static final String TAG = FirebaseFunctionsModule.class.getCanonicalName();

  private static final String DATA_KEY = "data";
  private static final String CODE_KEY = "code";
  private static final String MSG_KEY = "message";
  private static final String ERROR_KEY = "__error";
  private static final String DETAILS_KEY = "details";

  public FirebaseFunctionsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseFunctions";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
  }


  /**
   * Changes this instance to point to a Cloud Functions emulator running
   * locally.
   * <p>
   * See https://firebase.google.com/docs/functions/local-emulator
   *
   * @param origin  the origin string of the local emulator started via firebase tools
   *                "http://10.0.0.8:1337".
   * @param appName
   * @param region
   * @param origin
   * @param promise
   */
  @ExpoMethod
  public void useFunctionsEmulator(
          String appName,
          String region,
          String origin,
          Promise promise
  ) {
    FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
    FirebaseFunctions functionsInstance = FirebaseFunctions.getInstance(firebaseApp, region);
    functionsInstance.useFunctionsEmulator(origin);
    promise.resolve(null);
  }


  @ExpoMethod
  public void httpsCallable(String appName,
                            String region,
                            final String name,
                            Map<String, Object> wrapper,
                            final Promise promise) {
    Object input = wrapper.get(DATA_KEY);
    Log.d(TAG, "function:call:input:" + name + ":" + (input != null ? input.toString() : "null"));

    FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
    FirebaseFunctions functionsInstance = FirebaseFunctions.getInstance(firebaseApp, region);
    HttpsCallableReference httpsCallableReference = functionsInstance.getHttpsCallable(name);

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
                        "function:call:onSuccess:result:type:" + name + ":" + (result != null ? result
                                .getClass()
                                .getName() : "null")
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
                  code = ffe
                          .getCode()
                          .name();
                  message = ffe.getMessage();
                } else {
                  message = exception.getMessage();
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
