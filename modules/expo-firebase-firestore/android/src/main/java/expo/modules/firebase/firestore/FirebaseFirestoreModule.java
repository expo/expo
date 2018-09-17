package expo.modules.firebase.firestore;

import android.app.Activity;
import android.content.Context;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;
import android.util.SparseArray;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.FirebaseFirestoreException;
import com.google.firebase.firestore.FirebaseFirestoreSettings;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.firestore.Transaction;
import com.google.firebase.firestore.WriteBatch;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.modules.firebase.app.ErrorUtils;
import expo.modules.firebase.app.Utils;

public class FirebaseFirestoreModule extends ExportedModule implements ModuleRegistryConsumer, LifecycleEventListener {

  private static final String TAG = FirebaseFirestoreModule.class.getCanonicalName();

  private SparseArray<FirebaseFirestoreTransactionHandler> transactionHandlers = new SparseArray<>();

  private ModuleRegistry mModuleRegistry;

  public FirebaseFirestoreModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseFirestore";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    // Unregister from old UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
    }
    mModuleRegistry = moduleRegistry;

    // Register to new UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
    }
  }

  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  protected final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  /*
   * EXPO METHODS
   */

  @ExpoMethod
  public void disableNetwork(String appName, final Promise promise) {
    getFirestoreForApp(appName).disableNetwork().addOnCompleteListener(new OnCompleteListener<Void>() {
      @Override
      public void onComplete(@NonNull Task<Void> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "disableNetwork:onComplete:success");
          promise.resolve(null);
        } else {
          Log.e(TAG, "disableNetwork:onComplete:failure", task.getException());
          FirebaseFirestoreModule.promiseRejectException(promise, (FirebaseFirestoreException) task.getException());
        }
      }
    });
  }

  @ExpoMethod
  public void setLogLevel(String logLevel, Promise promise) {
    if ("debug".equals(logLevel) || "error".equals(logLevel)) {
      FirebaseFirestore.setLoggingEnabled(true);
    } else {
      FirebaseFirestore.setLoggingEnabled(false);
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void enableNetwork(String appName, final Promise promise) {
    getFirestoreForApp(appName).enableNetwork().addOnCompleteListener(new OnCompleteListener<Void>() {
      @Override
      public void onComplete(@NonNull Task<Void> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "enableNetwork:onComplete:success");
          promise.resolve(null);
        } else {
          Log.e(TAG, "enableNetwork:onComplete:failure", task.getException());
          FirebaseFirestoreModule.promiseRejectException(promise, (FirebaseFirestoreException) task.getException());
        }
      }
    });
  }

  @ExpoMethod
  public void collectionGet(String appName, String path, ArrayList filters, ArrayList orders,
      Map<String, Object> options, Map<String, Object> getOptions, final Promise promise) {
    FirebaseFirestoreCollectionReference ref = getCollectionForAppPath(appName, path, filters, orders, options);
    ref.get(getOptions, promise);
  }

  @ExpoMethod
  public void collectionOffSnapshot(String appName, String path, ArrayList filters, ArrayList orders,
      Map<String, Object> options, String listenerId, Promise promise) {
    FirebaseFirestoreCollectionReference.offSnapshot(listenerId);
    promise.resolve(null);
  }

  @ExpoMethod
  public void collectionOnSnapshot(String appName, String path, ArrayList filters, ArrayList orders,
      Map<String, Object> options, String listenerId, Map<String, Object> queryListenOptions, Promise promise) {
    FirebaseFirestoreCollectionReference ref = getCollectionForAppPath(appName, path, filters, orders, options);
    ref.onSnapshot(listenerId, queryListenOptions);
    promise.resolve(null);
  }

  @ExpoMethod
  public void documentBatch(final String appName, final ArrayList writes, final Promise promise) {
    FirebaseFirestore firestore = getFirestoreForApp(appName);
    WriteBatch batch = firestore.batch();
    final List<Object> writesArray = FirestoreSerialize.parseDocumentBatches(firestore, writes);

    for (Object w : writesArray) {
      Map<String, Object> write = (Map) w;
      String type = (String) write.get("type");
      String path = (String) write.get("path");
      Map<String, Object> data = (Map) write.get("data");

      DocumentReference ref = firestore.document(path);
      switch (type) {
      case "DELETE":
        batch = batch.delete(ref);
        break;
      case "SET":
        Map<String, Object> options = (Map) write.get("options");
        if (options != null && options.containsKey("merge") && (boolean) options.get("merge")) {
          batch = batch.set(ref, data, SetOptions.merge());
        } else {
          batch = batch.set(ref, data);
        }

        break;
      case "UPDATE":
        batch = batch.update(ref, data);
        break;
      }
    }

    batch.commit().addOnCompleteListener(new OnCompleteListener<Void>() {
      @Override
      public void onComplete(@NonNull Task<Void> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "documentBatch:onComplete:success");
          promise.resolve(null);
        } else {
          Log.e(TAG, "documentBatch:onComplete:failure", task.getException());
          FirebaseFirestoreModule.promiseRejectException(promise, (FirebaseFirestoreException) task.getException());
        }
      }
    });
  }

  @ExpoMethod
  public void documentDelete(String appName, String path, final Promise promise) {
    FirebaseFirestoreDocumentReference ref = getDocumentForAppPath(appName, path);
    ref.delete(promise);
  }

  @ExpoMethod
  public void documentGet(String appName, String path, Map<String, Object> getOptions, final Promise promise) {
    FirebaseFirestoreDocumentReference ref = getDocumentForAppPath(appName, path);
    ref.get(getOptions, promise);
  }

  @ExpoMethod
  public void documentOffSnapshot(String appName, String path, String listenerId, Promise promise) {
    FirebaseFirestoreDocumentReference.offSnapshot(listenerId);
    promise.resolve(null);
  }

  @ExpoMethod
  public void documentOnSnapshot(String appName, String path, String listenerId, Map<String, Object> docListenOptions,
      Promise promise) {
    FirebaseFirestoreDocumentReference ref = getDocumentForAppPath(appName, path);
    ref.onSnapshot(listenerId, docListenOptions);
    promise.resolve(null);
  }

  @ExpoMethod
  public void documentSet(String appName, String path, Map<String, Object> data, Map<String, Object> options,
      final Promise promise) {
    FirebaseFirestoreDocumentReference ref = getDocumentForAppPath(appName, path);
    ref.set(data, options, promise);
  }

  @ExpoMethod
  public void documentUpdate(String appName, String path, Map<String, Object> data, final Promise promise) {
    FirebaseFirestoreDocumentReference ref = getDocumentForAppPath(appName, path);
    ref.update(data, promise);
  }

  @ExpoMethod
  public void settings(String appName, Map<String, Object> settings, final Promise promise) {
    FirebaseFirestore firestore = getFirestoreForApp(appName);
    FirebaseFirestoreSettings.Builder firestoreSettings = new FirebaseFirestoreSettings.Builder();
    if (settings.containsKey("host")) {
      firestoreSettings.setHost((String) settings.get("host"));
    } else {
      firestoreSettings.setHost(firestore.getFirestoreSettings().getHost());
    }
    if (settings.containsKey("persistence")) {
      firestoreSettings.setPersistenceEnabled((boolean) settings.get("persistence"));
    } else {
      firestoreSettings.setPersistenceEnabled(firestore.getFirestoreSettings().isPersistenceEnabled());
    }
    if (settings.containsKey("ssl")) {
      firestoreSettings.setSslEnabled((boolean) settings.get("ssl"));
    } else {
      firestoreSettings.setSslEnabled(firestore.getFirestoreSettings().isSslEnabled());
    }
    if (settings.containsKey("timestampsInSnapshots")) {
      // TODO: Not supported on Android yet
    }

    firestore.setFirestoreSettings(firestoreSettings.build());
    promise.resolve(null);
  }

  /*
   * Transaction Methods
   */

  /**
   * Calls the internal Firestore Transaction classes instance .get(ref) method
   * and resolves with the DocumentSnapshot.
   *
   * @param appName
   * @param transactionId
   * @param path
   * @param promise
   */
  @ExpoMethod
  public void transactionGetDocument(String appName, int transactionId, String path, final Promise promise) {
    FirebaseFirestoreTransactionHandler handler = transactionHandlers.get(transactionId);

    if (handler == null) {
      promise.reject("internal-error",
          "An internal error occurred whilst attempting to find a native transaction by id.");
    } else {
      DocumentReference ref = getDocumentForAppPath(appName, path).getRef();
      handler.getDocument(ref, promise);
    }
  }

  /**
   * Aborts any pending signals and deletes the transaction handler.
   *
   * @param appName
   * @param transactionId
   */
  @ExpoMethod
  public void transactionDispose(String appName, int transactionId, Promise promise) {
    FirebaseFirestoreTransactionHandler handler = transactionHandlers.get(transactionId);

    if (handler != null) {
      handler.abort();
      transactionHandlers.delete(transactionId);
    }
    promise.resolve(null);
  }

  /**
   * Signals to transactionHandler that the command buffer is ready.
   *
   * @param appName
   * @param transactionId
   * @param commandBuffer
   */
  @ExpoMethod
  public void transactionApplyBuffer(String appName, int transactionId, ArrayList commandBuffer, Promise promise) {
    FirebaseFirestoreTransactionHandler handler = transactionHandlers.get(transactionId);

    if (handler != null) {
      handler.signalBufferReceived(commandBuffer);
    }
    promise.resolve(null);
  }

  /**
   * Begin a new transaction via AsyncTask 's
   *
   * @param appName
   * @param transactionId
   */
  @ExpoMethod
  public void transactionBegin(final String appName, int transactionId, Promise promise) {
    final FirebaseFirestoreTransactionHandler transactionHandler = new FirebaseFirestoreTransactionHandler(appName,
        transactionId);
    transactionHandlers.put(transactionId, transactionHandler);

    AsyncTask.execute(new Runnable() {
      @Override
      public void run() {
        getFirestoreForApp(appName).runTransaction(new Transaction.Function<Void>() {
          @Override
          public Void apply(@NonNull Transaction transaction) throws FirebaseFirestoreException {
            transactionHandler.resetState(transaction);

            // emit the update cycle to JS land using an async task
            // otherwise it gets blocked by the pending lock await
            AsyncTask.execute(new Runnable() {
              @Override
              public void run() {
                Bundle eventMap = transactionHandler.createEventMap(null, "update");
                Utils.sendEvent(mModuleRegistry, "firestore_transaction_event", eventMap);
              }
            });

            // wait for a signal to be received from JS land code
            transactionHandler.await();

            // exit early if aborted - has to throw an exception otherwise will just keep
            // trying ...
            if (transactionHandler.aborted) {
              throw new FirebaseFirestoreException("abort", FirebaseFirestoreException.Code.ABORTED);
            }

            // exit early if timeout from bridge - has to throw an exception otherwise will
            // just keep trying ...
            if (transactionHandler.timeout) {
              throw new FirebaseFirestoreException("timeout", FirebaseFirestoreException.Code.DEADLINE_EXCEEDED);
            }

            // process any buffered commands from JS land
            ArrayList buffer = transactionHandler.getCommandBuffer();

            // exit early if no commands
            if (buffer == null) {
              return null;
            }

            for (int i = 0, size = buffer.size(); i < size; i++) {
              Map<String, Object> data;
              Map<String, Object> command = (Map<String, Object>) buffer.get(i);
              String path = (String) command.get("path");
              String type = (String) command.get("type");
              FirebaseFirestoreDocumentReference documentReference = getDocumentForAppPath(appName, path);

              switch (type) {
              case "set":
                data = (Map<String, Object>) command.get("data");

                Map<String, Object> options = (Map<String, Object>) command.get("options");
                Map<String, Object> setData = FirestoreSerialize
                    .parseReadableMap(FirebaseFirestoreModule.getFirestoreForApp(appName), data);

                if (options != null && options.containsKey("merge") && (boolean) options.get("merge")) {
                  transaction.set(documentReference.getRef(), setData, SetOptions.merge());
                } else {
                  transaction.set(documentReference.getRef(), setData);
                }
                break;
              case "update":
                data = (Map<String, Object>) command.get("data");

                Map<String, Object> updateData = FirestoreSerialize
                    .parseReadableMap(FirebaseFirestoreModule.getFirestoreForApp(appName), data);
                transaction.update(documentReference.getRef(), updateData);
                break;
              case "delete":
                transaction.delete(documentReference.getRef());
                break;
              default:
                throw new IllegalArgumentException("Unknown command type at index " + i + ".");
              }
            }

            return null;
          }
        }).addOnSuccessListener(new OnSuccessListener<Void>() {
          @Override
          public void onSuccess(Void aVoid) {
            if (!transactionHandler.aborted) {
              Log.d(TAG, "Transaction onSuccess!");
              Bundle eventMap = transactionHandler.createEventMap(null, "complete");
              Utils.sendEvent(mModuleRegistry, "firestore_transaction_event", eventMap);
            }
          }
        }).addOnFailureListener(new OnFailureListener() {
          @Override
          public void onFailure(@NonNull Exception e) {
            if (!transactionHandler.aborted) {
              Log.w(TAG, "Transaction onFailure.", e);
              Bundle eventMap = transactionHandler.createEventMap((FirebaseFirestoreException) e, "error");
              Utils.sendEvent(mModuleRegistry, "firestore_transaction_event", eventMap);
            }
          }
        });
      }
    });
    promise.resolve(null);
  }

  /*
   * INTERNALS/UTILS
   */

  /**
   * Generates a js-like error from an exception and rejects the provided promise
   * with it.
   *
   * @param exception Exception Exception normally from a task result.
   * @param promise   Promise expo promise
   */
  static void promiseRejectException(Promise promise, FirebaseFirestoreException exception) {
    Bundle jsError = getJSError(exception);
    promise.reject(jsError.getString("code"), jsError.getString("message"), exception);
  }

  /**
   * Get a database instance for a specific firebase app instance
   *
   * @param appName
   * @return
   */
  static FirebaseFirestore getFirestoreForApp(String appName) {
    FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
    return FirebaseFirestore.getInstance(firebaseApp);
  }

  /**
   * Get a collection reference for a specific app and path
   *
   * @param appName
   * @param filters
   * @param orders
   * @param options
   * @param path    @return
   */
  private FirebaseFirestoreCollectionReference getCollectionForAppPath(String appName, String path, ArrayList filters,
      ArrayList orders, Map<String, Object> options) {
    return new FirebaseFirestoreCollectionReference(mModuleRegistry, appName, path, filters, orders,
        options);
  }

  /**
   * Get a document reference for a specific app and path
   *
   * @param appName
   * @param path
   * @return
   */
  private FirebaseFirestoreDocumentReference getDocumentForAppPath(String appName, String path) {
    return new FirebaseFirestoreDocumentReference(mModuleRegistry, appName, path);
  }

  /**
   * Convert as firebase DatabaseError instance into a writable map with the
   * correct web-like error codes.
   *
   * @param nativeException
   * @return
   */
  static Bundle getJSError(FirebaseFirestoreException nativeException) {
    Bundle errorMap = new Bundle();
    errorMap.putInt("nativeErrorCode", nativeException.getCode().value());
    errorMap.putString("nativeErrorMessage", nativeException.getMessage());

    String code;
    String message;
    String service = "Firestore";

    // TODO: Proper error mappings
    switch (nativeException.getCode()) {
    case OK:
      code = ErrorUtils.getCodeWithService(service, "ok");
      message = ErrorUtils.getMessageWithService("Ok.", service, code);
      break;
    case CANCELLED:
      code = ErrorUtils.getCodeWithService(service, "cancelled");
      message = ErrorUtils.getMessageWithService("The operation was cancelled.", service, code);
      break;
    case UNKNOWN:
      code = ErrorUtils.getCodeWithService(service, "unknown");
      message = ErrorUtils.getMessageWithService("Unknown error or an error from a different error domain.", service,
          code);
      break;
    case INVALID_ARGUMENT:
      code = ErrorUtils.getCodeWithService(service, "invalid-argument");
      message = ErrorUtils.getMessageWithService("Client specified an invalid argument.", service, code);
      break;
    case DEADLINE_EXCEEDED:
      code = ErrorUtils.getCodeWithService(service, "deadline-exceeded");
      message = ErrorUtils.getMessageWithService("Deadline expired before operation could complete.", service, code);
      break;
    case NOT_FOUND:
      code = ErrorUtils.getCodeWithService(service, "not-found");
      message = ErrorUtils.getMessageWithService("Some requested document was not found.", service, code);
      break;
    case ALREADY_EXISTS:
      code = ErrorUtils.getCodeWithService(service, "already-exists");
      message = ErrorUtils.getMessageWithService("Some document that we attempted to create already exists.", service,
          code);
      break;
    case PERMISSION_DENIED:
      code = ErrorUtils.getCodeWithService(service, "permission-denied");
      message = ErrorUtils.getMessageWithService(
          "The caller does not have permission to execute the specified operation.", service, code);
      break;
    case RESOURCE_EXHAUSTED:
      code = ErrorUtils.getCodeWithService(service, "resource-exhausted");
      message = ErrorUtils.getMessageWithService(
          "Some resource has been exhausted, perhaps a per-user quota, or perhaps the entire file system is out of space.",
          service, code);
      break;
    case FAILED_PRECONDITION:
      code = ErrorUtils.getCodeWithService(service, "failed-precondition");
      message = ErrorUtils.getMessageWithService(
          "Operation was rejected because the system is not in a state required for the operation`s execution.",
          service, code);
      break;
    case ABORTED:
      code = ErrorUtils.getCodeWithService(service, "aborted");
      message = ErrorUtils.getMessageWithService(
          "The operation was aborted, typically due to a concurrency issue like transaction aborts, etc.", service,
          code);
      break;
    case OUT_OF_RANGE:
      code = ErrorUtils.getCodeWithService(service, "out-of-range");
      message = ErrorUtils.getMessageWithService("Operation was attempted past the valid range.", service, code);
      break;
    case UNIMPLEMENTED:
      code = ErrorUtils.getCodeWithService(service, "unimplemented");
      message = ErrorUtils.getMessageWithService("Operation is not implemented or not supported/enabled.", service,
          code);
      break;
    case INTERNAL:
      code = ErrorUtils.getCodeWithService(service, "internal");
      message = ErrorUtils.getMessageWithService("Internal errors.", service, code);
      break;
    case UNAVAILABLE:
      code = ErrorUtils.getCodeWithService(service, "unavailable");
      message = ErrorUtils.getMessageWithService("The service is currently unavailable.", service, code);
      break;
    case DATA_LOSS:
      code = ErrorUtils.getCodeWithService(service, "data-loss");
      message = ErrorUtils.getMessageWithService("Unrecoverable data loss or corruption.", service, code);
      break;
    case UNAUTHENTICATED:
      code = ErrorUtils.getCodeWithService(service, "unauthenticated");
      message = ErrorUtils.getMessageWithService(
          "The request does not have valid authentication credentials for the operation.", service, code);
      break;
    default:
      code = ErrorUtils.getCodeWithService(service, "unknown");
      message = ErrorUtils.getMessageWithService("An unknown error occurred.", service, code);
    }

    errorMap.putString("code", code);
    errorMap.putString("message", message);
    return errorMap;
  }

  /**
   * Constants for FirebaseFirestore
   *
   * @return
   */
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("deleteFieldValue", FieldValue.delete().toString());
    constants.put("serverTimestampFieldValue", FieldValue.serverTimestamp().toString());
    return constants;
  }

  @Override
  public void onHostResume() {

  }

  @Override
  public void onHostPause() {

  }

  /**
   * Try clean up previous transactions on reload
   *
   */
  @Override
  public void onHostDestroy() {
    for (int i = 0, size = transactionHandlers.size(); i < size; i++) {
      FirebaseFirestoreTransactionHandler transactionHandler = transactionHandlers.get(i);
      if (transactionHandler != null) {
        transactionHandler.abort();
      }
    }
    transactionHandlers.clear();
  }
}
