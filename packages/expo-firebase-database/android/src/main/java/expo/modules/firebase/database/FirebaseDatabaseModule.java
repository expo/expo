package expo.modules.firebase.database;

import android.app.Activity;
import android.content.Context;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.util.SparseArray;

import com.google.firebase.FirebaseApp;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseException;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Logger;
import com.google.firebase.database.MutableData;
import com.google.firebase.database.OnDisconnect;
import com.google.firebase.database.ServerValue;
import com.google.firebase.database.Transaction;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.modules.firebase.app.ErrorUtils;
import expo.modules.firebase.app.Utils;

public class FirebaseDatabaseModule extends ExportedModule implements ModuleRegistryConsumer {

  private static final String TAG = FirebaseDatabaseModule.class.getCanonicalName();

  private static boolean enableLogging = false;
  private HashMap<String, FirebaseDatabaseReference> references = new HashMap<>();
  private static HashMap<String, Boolean> loggingLevelSet = new HashMap<>();
  private SparseArray<FirebaseTransactionHandler> transactionHandlers = new SparseArray<>();

  private ModuleRegistry mModuleRegistry;

  FirebaseDatabaseModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseDatabase";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  /**
   * @param appName
   */
  @ExpoMethod
  public void goOnline(String appName, String dbURL, Promise promise) {
    getDatabaseForApp(appName, dbURL).goOnline();
    promise.resolve(null);
  }

  /**
   * @param appName
   */
  @ExpoMethod
  public void goOffline(String appName, String dbURL, Promise promise) {
    getDatabaseForApp(appName, dbURL).goOffline();
    promise.resolve(null);
  }

  /**
   * @param appName
   * @param state
   */
  @ExpoMethod
  public void setPersistence(String appName, String dbURL, Boolean state, Promise promise) {
    getDatabaseForApp(appName, dbURL).setPersistenceEnabled(state);
    promise.resolve(null);
  }

  /**
   * @param appName
   * @param size
   */
  @ExpoMethod
  public void setPersistenceCacheSizeBytes(String appName, String dbURL, int size, Promise promise) {
    getDatabaseForApp(appName, dbURL).setPersistenceCacheSizeBytes((long) size);
    promise.resolve(null);
  }

  /**
   * @param enabled
   */
  @ExpoMethod
  public void enableLogging(Boolean enabled, Promise promise) {
    enableLogging = enabled;
    List<FirebaseApp> firebaseAppList = FirebaseApp.getApps(getApplicationContext());
    for (FirebaseApp app : firebaseAppList) {
      loggingLevelSet.put(app.getName(), enabled);
      try {
        if (enableLogging) {
          FirebaseDatabase.getInstance(app).setLogLevel(Logger.Level.DEBUG);
        } else {
          FirebaseDatabase.getInstance(app).setLogLevel(Logger.Level.WARN);
        }
      } catch (DatabaseException dex) {
        // do nothing - to catch 'calls to setLogLevel must be made for use of database'
        // errors
        // only occurs in dev after reloading or if user has actually incorrectly called
        // it.
        Log.w(TAG,
            "WARNING: enableLogging(bool) must be called before any other use of database(). \n"
                + "If you are sure you've done this then this message can be ignored during development as \n"
                + "RN reloads can cause false positives. APP: " + app.getName());
        promise.reject(dex);
      }
    }
    promise.resolve(null);
  }

  /**
   * @param appName
   * @param path
   * @param state
   */
  @ExpoMethod
  public void keepSynced(String appName, String dbURL, String key, String path, ArrayList modifiers, Boolean state,
      Promise promise) {
    getInternalReferenceForApp(appName, dbURL, key, path, modifiers).getQuery().keepSynced(state);
    promise.resolve(null);
  }

  /*
   * TRANSACTIONS
   */

  /**
   * @param transactionId
   * @param updates
   */
  @ExpoMethod
  public void transactionTryCommit(String appName, String dbURL, int transactionId, Map<String, Object> updates,
      Promise promise) {
    FirebaseTransactionHandler handler = transactionHandlers.get(transactionId);

    if (handler != null) {
      handler.signalUpdateReceived(updates);
    }
    promise.resolve(null);
  }

  /**
   * Start a native transaction and store it's state in
   *
   * @param appName
   * @param path
   * @param transactionId
   * @param applyLocally
   */
  @ExpoMethod
  public void transactionStart(final String appName, final String dbURL, final String path, final int transactionId,
      final Boolean applyLocally, final Promise promise) {
    AsyncTask.execute(new Runnable() {
      @Override
      public void run() {
        DatabaseReference reference = getReferenceForAppPath(appName, dbURL, path);

        reference.runTransaction(new Transaction.Handler() {
          @Override
          public Transaction.Result doTransaction(MutableData mutableData) {
            final FirebaseTransactionHandler transactionHandler = new FirebaseTransactionHandler(transactionId, appName,
                dbURL);
            transactionHandlers.put(transactionId, transactionHandler);
            final Bundle updatesMap = transactionHandler.createUpdateMap(mutableData);

            // emit the updates to js using an async task
            // otherwise it gets blocked by the lock await
            AsyncTask.execute(new Runnable() {
              @Override
              public void run() {
                Utils.sendEvent(mModuleRegistry, "database_transaction_event", updatesMap);
              }
            });

            // wait for js to return the updates (js calls transactionTryCommit)
            try {
              transactionHandler.await();
            } catch (InterruptedException e) {
              transactionHandler.interrupted = true;
              return Transaction.abort();
            }

            if (transactionHandler.abort) {
              return Transaction.abort();
            }

            mutableData.setValue(transactionHandler.value);
            return Transaction.success(mutableData);
          }

          @Override
          public void onComplete(DatabaseError error, boolean committed, DataSnapshot snapshot) {
            FirebaseTransactionHandler transactionHandler = transactionHandlers.get(transactionId);
            Bundle resultMap = transactionHandler.createResultMap(error, committed, snapshot);
            Utils.sendEvent(mModuleRegistry, "database_transaction_event", resultMap);
            transactionHandlers.delete(transactionId);

            if (error != null) {
              handlePromise(promise, error);
            } else {
              promise.resolve(null);
            }
          }

        }, applyLocally);
      }
    });
  }

  /*
   * ON DISCONNECT
   */

  /**
   * Set a value on a ref when the client disconnects from the firebase server.
   *
   * @param appName
   * @param path
   * @param props
   * @param promise
   */
  @ExpoMethod
  public void onDisconnectSet(String appName, String dbURL, String path, Map<String, Object> props,
      final Promise promise) {
    String type = (String) props.get("type");
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);

    OnDisconnect onDisconnect = ref.onDisconnect();
    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    };

    switch (type) {
    case "object":
      Map<String, Object> map = (Map<String, Object>) props.get("value");
      onDisconnect.setValue(map, listener);
      break;
    case "array":
      List<Object> list = Utils.recursivelyDeconstructReadableArray((ArrayList) props.get("value"));
      onDisconnect.setValue(list, listener);
      break;
    case "string":
      onDisconnect.setValue(props.get("value"), listener);
      break;
    case "number":
      onDisconnect.setValue(props.get("value"), listener);
      break;
    case "boolean":
      onDisconnect.setValue(props.get("value"), listener);
      break;
    case "null":
      onDisconnect.setValue(null, listener);
      break;
    }
  }

  /**
   * Update a value on a ref when the client disconnects from the firebase server.
   *
   * @param appName
   * @param path
   * @param props
   * @param promise
   */
  @ExpoMethod
  public void onDisconnectUpdate(String appName, String dbURL, String path, Map<String, Object> props,
      final Promise promise) {
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);
    OnDisconnect ondDisconnect = ref.onDisconnect();

    Map<String, Object> map = props;

    ondDisconnect.updateChildren(map, new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    });
  }

  /**
   * Remove a ref when the client disconnects from the firebase server.
   *
   * @param appName
   * @param path
   * @param promise
   */
  @ExpoMethod
  public void onDisconnectRemove(String appName, String dbURL, String path, final Promise promise) {
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);
    OnDisconnect onDisconnect = ref.onDisconnect();

    onDisconnect.removeValue(new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    });
  }

  /**
   * Cancel a pending onDisconnect action.
   *
   * @param appName
   * @param path
   * @param promise
   */
  @ExpoMethod
  public void onDisconnectCancel(String appName, String dbURL, String path, final Promise promise) {
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);
    OnDisconnect onDisconnect = ref.onDisconnect();

    onDisconnect.cancel(new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    });
  }

  /**
   * @param appName
   * @param path
   * @param props
   * @param promise
   */
  @ExpoMethod
  public void set(String appName, String dbURL, String path, final Map<String, Object> props, final Promise promise) {
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);
    Object value = props.get("value");

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    };

    ref.setValue(value, listener);
  }

  /**
   * @param appName
   * @param path
   * @param priority
   * @param promise
   */
  @ExpoMethod
  public void setPriority(String appName, String dbURL, String path, Map<String, Object> priority,
      final Promise promise) {
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);
    Object priorityValue = priority.get("value");

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    };

    ref.setPriority(priorityValue, listener);
  }

  /**
   * @param appName
   * @param path
   * @param data
   * @param priority
   * @param promise
   */
  @ExpoMethod
  public void setWithPriority(String appName, String dbURL, String path, Map<String, Object> data,
      Map<String, Object> priority, final Promise promise) {
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);
    Object dataValue = data.get("value");
    Object priorityValue = priority.get("value");

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    };

    ref.setValue(dataValue, priorityValue, listener);
  }

  /**
   * @param appName
   * @param path
   * @param props
   * @param promise
   */
  @ExpoMethod
  public void update(String appName, String dbURL, String path, Map<String, Object> props, final Promise promise) {
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);
    Map<String, Object> updates = props;

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    };

    ref.updateChildren(updates, listener);
  }

  /**
   * @param appName
   * @param path
   * @param promise
   */
  @ExpoMethod
  public void remove(String appName, String dbURL, String path, final Promise promise) {
    DatabaseReference ref = getReferenceForAppPath(appName, dbURL, path);

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handlePromise(promise, error);
      }
    };

    ref.removeValue(listener);
  }

  /**
   * Subscribe once to a firebase reference.
   *
   * @param appName
   * @param key
   * @param path
   * @param modifiers
   * @param eventType
   * @param promise
   */
  @ExpoMethod
  public void once(String appName, String dbURL, String key, String path, ArrayList modifiers, String eventType,
      Promise promise) {
    getInternalReferenceForApp(appName, dbURL, key, path, modifiers).once(eventType, promise);
  }

  /**
   * Subscribe to real time events for the specified database path + modifiers
   *
   * @param appName String
   * @param props   ReadableMap
   */
  @ExpoMethod
  public void on(String appName, String dbURL, Map<String, Object> props, Promise promise) {
    getCachedInternalReferenceForApp(appName, dbURL, props).on((String) props.get("eventType"),
        (Map<String, Object>) props.get("registration"));
    promise.resolve(null);
  }

  /**
   * Removes the specified event registration key. If the ref no longer has any
   * listeners the the ref is removed.
   *
   * @param key
   * @param eventRegistrationKey
   */
  @ExpoMethod
  public void off(String key, String eventRegistrationKey, Promise promise) {
    FirebaseDatabaseReference nativeRef = references.get(key);
    if (nativeRef != null) {
      nativeRef.removeEventListener(eventRegistrationKey);

      if (!nativeRef.hasListeners()) {
        references.remove(key);
      }
    }
    promise.resolve(null);
  }

  /*
   * INTERNALS/UTILS
   */

  /**
   * Resolve null or reject with a js like error if databaseError exists
   *
   * @param promise
   * @param databaseError
   */
  static void handlePromise(Promise promise, DatabaseError databaseError) {
    if (databaseError != null) {
      Bundle jsError = getJSError(databaseError);
      promise.reject(jsError.getString("code"), jsError.getString("message"), databaseError.toException());
    } else {
      promise.resolve(null);
    }
  }

  /**
   * Get a database instance for a specific firebase app instance
   *
   * @param appName
   * @param dbURL
   * @return
   */
  public static FirebaseDatabase getDatabaseForApp(String appName, String dbURL) {
    FirebaseDatabase firebaseDatabase;
    if (dbURL != null && dbURL.length() > 0) {
      if (appName != null && appName.length() > 0) {
        FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
        firebaseDatabase = FirebaseDatabase.getInstance(firebaseApp, dbURL);
      } else {
        firebaseDatabase = FirebaseDatabase.getInstance(dbURL);
      }
    } else {
      FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);
      firebaseDatabase = FirebaseDatabase.getInstance(firebaseApp);
    }

    Boolean logLevel = loggingLevelSet.get(firebaseDatabase.getApp().getName());

    if (enableLogging && (logLevel == null || !logLevel)) {
      try {
        loggingLevelSet.put(firebaseDatabase.getApp().getName(), enableLogging);
        firebaseDatabase.setLogLevel(Logger.Level.DEBUG);
      } catch (DatabaseException dex) {
        // do nothing - to catch 'calls to setLogLevel must be made for use of database'
        // errors
        // only occurs in dev after reloading or if user has actually incorrectly called
        // it.
        Log.w(TAG,
            "WARNING: enableLogging(bool) must be called before any other use of database(). \n"
                + "If you are sure you've done this then this message can be ignored during development as \n"
                + "RN reloads can cause false positives. APP: " + firebaseDatabase.getApp().getName());
      }
    } else if (!enableLogging && (logLevel != null && logLevel)) {
      try {
        loggingLevelSet.put(firebaseDatabase.getApp().getName(), enableLogging);
        firebaseDatabase.setLogLevel(Logger.Level.WARN);
      } catch (DatabaseException dex) {
        // do nothing - to catch 'calls to setLogLevel must be made for use of database'
        // errors
        // only occurs in dev after reloading or if user has actually incorrectly called
        // it.
        Log.w(TAG,
            "WARNING: enableLogging(bool) must be called before any other use of database(). \n"
                + "If you are sure you've done this then this message can be ignored during development as \n"
                + "RN reloads can cause false positives. APP: " + firebaseDatabase.getApp().getName());
      }
    }

    return firebaseDatabase;
  }

  /**
   * Get a database reference for a specific app and path
   *
   * @param appName
   * @param path
   * @return
   */
  private DatabaseReference getReferenceForAppPath(String appName, String dbURL, String path) {
    return getDatabaseForApp(appName, dbURL).getReference(path);
  }

  /**
   * Return an existing or create a new FirebaseDatabaseReference instance.
   *
   * @param appName
   * @param key
   * @param path
   * @param modifiers
   * @return
   */
  private FirebaseDatabaseReference getInternalReferenceForApp(String appName, String dbURL, String key, String path,
      ArrayList modifiers) {
    return new FirebaseDatabaseReference(getApplicationContext(), mModuleRegistry, appName, dbURL, key, path,
        modifiers);
  }

  /**
   * TODO
   *
   * @param appName
   * @param props
   * @return
   */
  private FirebaseDatabaseReference getCachedInternalReferenceForApp(String appName, String dbURL,
      Map<String, Object> props) {
    String key = (String) props.get("key");
    String path = (String) props.get("path");
    ArrayList modifiers = (ArrayList) props.get("modifiers");

    FirebaseDatabaseReference existingRef = references.get(key);

    if (existingRef == null) {
      existingRef = getInternalReferenceForApp(appName, dbURL, key, path, modifiers);
      references.put(key, existingRef);
    }

    return existingRef;
  }

  /**
   * Convert as firebase DatabaseError instance into a writable map with the
   * correct web-like error codes.
   *
   * @param nativeError
   * @return
   */
  static Bundle getJSError(DatabaseError nativeError) {
    Bundle errorMap = new Bundle();
    errorMap.putInt("nativeErrorCode", nativeError.getCode());
    errorMap.putString("nativeErrorMessage", nativeError.getMessage());

    String code;
    String message;
    String service = "Database";

    switch (nativeError.getCode()) {
    case DatabaseError.DATA_STALE:
      code = ErrorUtils.getCodeWithService(service, "data-stale");
      message = ErrorUtils.getMessageWithService("The transaction needs to be run again with current data.", service,
          code);
      break;
    case DatabaseError.OPERATION_FAILED:
      code = ErrorUtils.getCodeWithService(service, "failure");
      message = ErrorUtils.getMessageWithService("The server indicated that this operation failed.", service, code);
      break;
    case DatabaseError.PERMISSION_DENIED:
      code = ErrorUtils.getCodeWithService(service, "permission-denied");
      message = ErrorUtils.getMessageWithService("Client doesn't have permission to access the desired data.", service,
          code);
      break;
    case DatabaseError.DISCONNECTED:
      code = ErrorUtils.getCodeWithService(service, "disconnected");
      message = ErrorUtils.getMessageWithService("The operation had to be aborted due to a network disconnect.",
          service, code);
      break;
    case DatabaseError.EXPIRED_TOKEN:
      code = ErrorUtils.getCodeWithService(service, "expired-token");
      message = ErrorUtils.getMessageWithService("The supplied auth token has expired.", service, code);
      break;
    case DatabaseError.INVALID_TOKEN:
      code = ErrorUtils.getCodeWithService(service, "invalid-token");
      message = ErrorUtils.getMessageWithService("The supplied auth token was invalid.", service, code);
      break;
    case DatabaseError.MAX_RETRIES:
      code = ErrorUtils.getCodeWithService(service, "max-retries");
      message = ErrorUtils.getMessageWithService("The transaction had too many retries.", service, code);
      break;
    case DatabaseError.OVERRIDDEN_BY_SET:
      code = ErrorUtils.getCodeWithService(service, "overridden-by-set");
      message = ErrorUtils.getMessageWithService("The transaction was overridden by a subsequent set.", service, code);
      break;
    case DatabaseError.UNAVAILABLE:
      code = ErrorUtils.getCodeWithService(service, "unavailable");
      message = ErrorUtils.getMessageWithService("The service is unavailable.", service, code);
      break;
    case DatabaseError.USER_CODE_EXCEPTION:
      code = ErrorUtils.getCodeWithService(service, "user-code-exception");
      message = ErrorUtils.getMessageWithService(
          "User code called from the Firebase Database runloop threw an exception.", service, code);
      break;
    case DatabaseError.NETWORK_ERROR:
      code = ErrorUtils.getCodeWithService(service, "network-error");
      message = ErrorUtils.getMessageWithService("The operation could not be performed due to a network error.",
          service, code);
      break;
    case DatabaseError.WRITE_CANCELED:
      code = ErrorUtils.getCodeWithService(service, "write-cancelled");
      message = ErrorUtils.getMessageWithService("The write was canceled by the user.", service, code);
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
   * React Native constants for FirebaseDatabase
   *
   * @return
   */
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("serverValueTimestamp", ServerValue.TIMESTAMP);
    return constants;
  }
}
