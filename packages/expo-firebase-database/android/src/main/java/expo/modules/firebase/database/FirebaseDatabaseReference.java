package expo.modules.firebase.database;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.modules.firebase.app.Utils;

class FirebaseDatabaseReference {
  private static final String TAG = FirebaseDatabaseReference.class.getCanonicalName();

  private String key;
  private Query query;
  private String appName;
  private String dbURL;
  private Context context;
  private ModuleRegistry moduleRegistry;

  private HashMap<String, ChildEventListener> childEventListeners = new HashMap<>();
  private HashMap<String, ValueEventListener> valueEventListeners = new HashMap<>();

  /**
   * AsyncTask to convert DataSnapshot instances to WritableMap instances.
   *
   * Introduced due to https://github.com/invertase/react-native-firebase/issues/1284
   */
  private static class DataSnapshotToMapAsyncTask extends AsyncTask<Object, Void, Bundle> {

    private WeakReference<Context> contextWeakReference;
    private WeakReference<FirebaseDatabaseReference> referenceWeakReference;
    private WeakReference<ModuleRegistry> moduleRegistryWeakReferenceWeakReference;

    DataSnapshotToMapAsyncTask(Context context, FirebaseDatabaseReference reference, ModuleRegistry moduleRegistry) {
      referenceWeakReference = new WeakReference<>(reference);
      contextWeakReference = new WeakReference<>(context);
      moduleRegistryWeakReferenceWeakReference = new WeakReference<>(moduleRegistry);
    }

    @Override
    protected final Bundle doInBackground(Object... params) {
      DataSnapshot dataSnapshot = (DataSnapshot) params[0];
      @Nullable String previousChildName = (String) params[1];

      try {
        return FirebaseDatabaseUtils.snapshotToMap(dataSnapshot, previousChildName);
      } catch (RuntimeException e) {
        if (isAvailable()) {
          // TODO: Evan: Add this without React
//          contextWeakReference.get();
//          if (contextWeakReference.get() instanceof ReactApplicationContext) {
//            ((ReactApplicationContext)contextWeakReference.get()).handleException(e);
//          }
        }
        throw e;
      }
    }

    @Override
    protected void onPostExecute(Bundle writableMap) {
      // do nothing as overridden on usage
    }

    Boolean isAvailable() {
      return contextWeakReference.get() != null && referenceWeakReference.get() != null && moduleRegistryWeakReferenceWeakReference.get() != null;
    }
  }

  /**
   * Firebase wrapper around FirebaseDatabaseReference,
   * handles Query generation and event listeners.
   *
   * @param context
   * @param app
   * @param refKey
   * @param refPath
   * @param modifiersArray
   */
  FirebaseDatabaseReference(Context context, ModuleRegistry moduleRegistry, String app, String url, String refKey, String refPath, ArrayList modifiersArray) {
    this.key = refKey;
    this.query = null;
    this.appName = app;
    this.dbURL = url;
    this.context = context;
    this.moduleRegistry = moduleRegistry;
    buildDatabaseQueryAtPathAndModifiers(refPath, modifiersArray);
  }


  /**
   * Used outside of class for keepSynced etc.
   *
   * @return Query
   */
  Query getQuery() {
    return query;
  }

  /**
   * Returns true/false whether this internal ref has a specific listener by eventRegistrationKey.
   *
   * @param eventRegistrationKey
   * @return
   */
  private Boolean hasEventListener(String eventRegistrationKey) {
    return valueEventListeners.containsKey(eventRegistrationKey) || childEventListeners.containsKey(eventRegistrationKey);
  }

  /**
   * Returns true/false whether this internal ref has any child or value listeners.
   *
   * @return
   */
  Boolean hasListeners() {
    return valueEventListeners.size() > 0 || childEventListeners.size() > 0;
  }

  /**
   * Remove an event listener by key, will remove either a ValueEventListener or
   * a ChildEventListener
   *
   * @param eventRegistrationKey
   */
  void removeEventListener(String eventRegistrationKey) {
    if (valueEventListeners.containsKey(eventRegistrationKey)) {
      query.removeEventListener(valueEventListeners.get(eventRegistrationKey));
      valueEventListeners.remove(eventRegistrationKey);
    }

    if (childEventListeners.containsKey(eventRegistrationKey)) {
      query.removeEventListener(childEventListeners.get(eventRegistrationKey));
      childEventListeners.remove(eventRegistrationKey);
    }
  }

  /**
   * Add a ValueEventListener to the query and internally keep a reference to it.
   *
   * @param eventRegistrationKey
   * @param listener
   */
  private void addEventListener(String eventRegistrationKey, ValueEventListener listener) {
    valueEventListeners.put(eventRegistrationKey, listener);
    query.addValueEventListener(listener);

  }


  /**
   * Add a ChildEventListener to the query and internally keep a reference to it.
   *
   * @param eventRegistrationKey
   * @param listener
   */
  private void addEventListener(String eventRegistrationKey, ChildEventListener listener) {
    childEventListeners.put(eventRegistrationKey, listener);
    query.addChildEventListener(listener);

  }

  /**
   * Listen for a single .once('value',..) event from firebase.
   *
   * @param promise
   */
  private void addOnceValueEventListener(final Promise promise) {
    @SuppressLint("StaticFieldLeak")
    final DataSnapshotToMapAsyncTask asyncTask = new DataSnapshotToMapAsyncTask(context, this, moduleRegistry) {
      @Override
      protected void onPostExecute(Bundle writableMap) {
        if (this.isAvailable()) {
          promise.resolve(writableMap);
        }
      }
    };

    ValueEventListener onceValueEventListener = new ValueEventListener() {
      @Override
      public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
        asyncTask.execute(dataSnapshot, null);
      }

      @Override
      public void onCancelled(@NonNull DatabaseError error) {
        FirebaseDatabaseModule.handlePromise(promise, error);
      }
    };

    query.addListenerForSingleValueEvent(onceValueEventListener);
    Log.d(TAG, "Added OnceValueEventListener for key: " + key);
  }

  /**
   * Listen for single '.once(child_X, ...)' event from firebase.
   *
   * @param eventName
   * @param promise
   */
  private void addChildOnceEventListener(final String eventName, final Promise promise) {
    ChildEventListener childEventListener = new ChildEventListener() {
      @Override
      public void onChildAdded(@NonNull DataSnapshot dataSnapshot, String previousChildName) {
        if ("child_added".equals(eventName)) {
          query.removeEventListener(this);
          Bundle data = FirebaseDatabaseUtils.snapshotToMap(dataSnapshot, previousChildName);
          promise.resolve(data);
        }
      }

      @Override
      public void onChildChanged(@NonNull DataSnapshot dataSnapshot, String previousChildName) {
        if ("child_changed".equals(eventName)) {
          query.removeEventListener(this);
          Bundle data = FirebaseDatabaseUtils.snapshotToMap(dataSnapshot, previousChildName);
          promise.resolve(data);
        }
      }

      @Override
      public void onChildRemoved(@NonNull DataSnapshot dataSnapshot) {
        if ("child_removed".equals(eventName)) {
          query.removeEventListener(this);
          Bundle data = FirebaseDatabaseUtils.snapshotToMap(dataSnapshot, null);
          promise.resolve(data);
        }
      }

      @Override
      public void onChildMoved(@NonNull DataSnapshot dataSnapshot, String previousChildName) {
        if ("child_moved".equals(eventName)) {
          query.removeEventListener(this);
          Bundle data = FirebaseDatabaseUtils.snapshotToMap(dataSnapshot, previousChildName);
          promise.resolve(data);
        }
      }

      @Override
      public void onCancelled(@NonNull DatabaseError error) {
        query.removeEventListener(this);
        FirebaseDatabaseModule.handlePromise(promise, error);
      }
    };

    query.addChildEventListener(childEventListener);
  }


  /**
   * Handles a React Native JS '.on(..)' request and initializes listeners.
   *
   * @param registration
   */
  void on(String eventType, Map<String, Object> registration) {
    if (eventType.equals("value")) {
      addValueEventListener(registration);
    } else {
      addChildEventListener(registration, eventType);
    }
  }

  /**
   * Handles a React Native JS 'once' request.
   *
   * @param eventType
   * @param promise
   */
  void once(String eventType, Promise promise) {
    if (eventType.equals("value")) {
      addOnceValueEventListener(promise);
    } else {
      addChildOnceEventListener(eventType, promise);
    }
  }


  /**
   * Add a native .on('child_X',.. ) event listener.
   *
   * @param registration
   * @param eventType
   */
  private void addChildEventListener(final Map<String, Object> registration, final String eventType) {
    final String eventRegistrationKey = (String) registration.get("eventRegistrationKey");
    final String registrationCancellationKey = (String) registration.get("registrationCancellationKey");

    if (!hasEventListener(eventRegistrationKey)) {
      ChildEventListener childEventListener = new ChildEventListener() {
        @Override
        public void onChildAdded(@NonNull DataSnapshot dataSnapshot, String previousChildName) {
          if ("child_added".equals(eventType)) {
            handleDatabaseEvent("child_added", registration, dataSnapshot, previousChildName);
          }
        }

        @Override
        public void onChildChanged(@NonNull DataSnapshot dataSnapshot, String previousChildName) {
          if ("child_changed".equals(eventType)) {
            handleDatabaseEvent("child_changed", registration, dataSnapshot, previousChildName);
          }
        }

        @Override
        public void onChildRemoved(@NonNull DataSnapshot dataSnapshot) {
          if ("child_removed".equals(eventType)) {
            handleDatabaseEvent("child_removed", registration, dataSnapshot, null);
          }
        }

        @Override
        public void onChildMoved(@NonNull DataSnapshot dataSnapshot, String previousChildName) {
          if ("child_moved".equals(eventType)) {
            handleDatabaseEvent("child_moved", registration, dataSnapshot, previousChildName);
          }
        }

        @Override
        public void onCancelled(@NonNull DatabaseError error) {
          removeEventListener(eventRegistrationKey);
          handleDatabaseError(registration, error);
        }
      };

      addEventListener(eventRegistrationKey, childEventListener);
    }
  }

  /**
   * Add a native .on('value',.. ) event listener.
   *
   * @param registration
   */
  private void addValueEventListener(final Map<String, Object> registration) {
    final String eventRegistrationKey = (String)registration.get("eventRegistrationKey");

    if (!hasEventListener(eventRegistrationKey)) {
      ValueEventListener valueEventListener = new ValueEventListener() {
        @Override
        public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
          handleDatabaseEvent("value", registration, dataSnapshot, null);
        }

        @Override
        public void onCancelled(@NonNull DatabaseError error) {
          removeEventListener(eventRegistrationKey);
          handleDatabaseError(registration, error);
        }
      };

      addEventListener(eventRegistrationKey, valueEventListener);
    }
  }

  /**
   * Handles value/child update events.
   *
   * @param eventType
   * @param dataSnapshot
   * @param previousChildName
   */
  private void handleDatabaseEvent(final String eventType, final Map<String, Object> registration, DataSnapshot dataSnapshot, @Nullable String previousChildName) {
    @SuppressLint("StaticFieldLeak")
    DataSnapshotToMapAsyncTask asyncTask = new DataSnapshotToMapAsyncTask(context, this, moduleRegistry) {
      @Override
      protected void onPostExecute(Bundle data) {
        if (this.isAvailable()) {
          Bundle event = new Bundle();
          event.putBundle("data", data);
          event.putString("key", key);
          event.putString("eventType", eventType);
          event.putBundle("registration", Utils.readableMapToWritableMap(registration));
          Utils.sendEvent(moduleRegistry, "database_sync_event", event);
        }
      }
    };

    asyncTask.execute(dataSnapshot, previousChildName);
  }

  /**
   * Handles a database listener cancellation error.
   *
   * @param error
   */
  private void handleDatabaseError(Map<String, Object> registration, DatabaseError error) {
    Bundle event = new Bundle();

    event.putString("key", key);
    event.putBundle("error", FirebaseDatabaseModule.getJSError(error));
    event.putBundle("registration", Utils.readableMapToWritableMap(registration));

    Utils.sendEvent(moduleRegistry, "database_sync_event", event);
  }

  /**
   * @param path
   * @param modifiers
   * @return
   */
  private void buildDatabaseQueryAtPathAndModifiers(String path, ArrayList modifiers) {
    FirebaseDatabase firebaseDatabase = FirebaseDatabaseModule.getDatabaseForApp(appName, dbURL);
    query = firebaseDatabase.getReference(path);
    List<Object> modifiersList = Utils.recursivelyDeconstructReadableArray(modifiers);

    for (Object m : modifiersList) {
      Map modifier = (Map) m;
      String type = (String) modifier.get("type");
      String name = (String) modifier.get("name");

      if ("orderBy".equals(type)) {
        applyOrderByModifier(name, type, modifier);
      } else if ("limit".equals(type)) {
        applyLimitModifier(name, type, modifier);
      } else if ("filter".equals(type)) {
        applyFilterModifier(name, modifier);
      }
    }
  }

  /* =================
   *  QUERY MODIFIERS
   * =================
   */

  /**
   * @param name
   * @param type
   * @param modifier
   */
  private void applyOrderByModifier(String name, String type, Map modifier) {
    switch (name) {
      case "orderByKey":
        query = query.orderByKey();
        break;
      case "orderByPriority":
        query = query.orderByPriority();
        break;
      case "orderByValue":
        query = query.orderByValue();
        break;
      case "orderByChild":
        String key = (String) modifier.get("key");
        query = query.orderByChild(key);
    }
  }

  /**
   * @param name
   * @param type
   * @param modifier
   */
  private void applyLimitModifier(String name, String type, Map modifier) {
    int limit = ((Double) modifier.get("limit")).intValue();
    if ("limitToLast".equals(name)) {
      query = query.limitToLast(limit);
    } else if ("limitToFirst".equals(name)) {
      query = query.limitToFirst(limit);
    }
  }

  /**
   * @param name
   * @param modifier
   */
  private void applyFilterModifier(String name, Map modifier) {
    String valueType = (String) modifier.get("valueType");
    String key = (String) modifier.get("key");
    if ("equalTo".equals(name)) {
      applyEqualToFilter(key, valueType, modifier);
    } else if ("endAt".equals(name)) {
      applyEndAtFilter(key, valueType, modifier);
    } else if ("startAt".equals(name)) {
      applyStartAtFilter(key, valueType, modifier);
    }
  }


  /* ===============
   *  QUERY FILTERS
   * ===============
   */

  /**
   * @param key
   * @param valueType
   * @param modifier
   */
  private void applyEqualToFilter(String key, String valueType, Map modifier) {
    if ("number".equals(valueType)) {
      double value = (Double) modifier.get("value");
      if (key == null) {
        query = query.equalTo(value);
      } else {
        query = query.equalTo(value, key);
      }
    } else if ("boolean".equals(valueType)) {
      boolean value = (Boolean) modifier.get("value");
      if (key == null) {
        query = query.equalTo(value);
      } else {
        query = query.equalTo(value, key);
      }
    } else if ("string".equals(valueType)) {
      String value = (String) modifier.get("value");
      if (key == null) {
        query = query.equalTo(value);
      } else {
        query = query.equalTo(value, key);
      }
    }
  }

  /**
   * @param key
   * @param valueType
   * @param modifier
   */
  private void applyEndAtFilter(String key, String valueType, Map modifier) {
    if ("number".equals(valueType)) {
      double value = (Double) modifier.get("value");
      if (key == null) {
        query = query.endAt(value);
      } else {
        query = query.endAt(value, key);
      }
    } else if ("boolean".equals(valueType)) {
      boolean value = (Boolean) modifier.get("value");
      if (key == null) {
        query = query.endAt(value);
      } else {
        query = query.endAt(value, key);
      }
    } else if ("string".equals(valueType)) {
      String value = (String) modifier.get("value");
      if (key == null) {
        query = query.endAt(value);
      } else {
        query = query.endAt(value, key);
      }
    }
  }

  /**
   * @param key
   * @param valueType
   * @param modifier
   */
  private void applyStartAtFilter(String key, String valueType, Map modifier) {
    if ("number".equals(valueType)) {
      double value = (Double) modifier.get("value");
      if (key == null) {
        query = query.startAt(value);
      } else {
        query = query.startAt(value, key);
      }
    } else if ("boolean".equals(valueType)) {
      boolean value = (Boolean) modifier.get("value");
      if (key == null) {
        query = query.startAt(value);
      } else {
        query = query.startAt(value, key);
      }
    } else if ("string".equals(valueType)) {
      String value = (String) modifier.get("value");
      if (key == null) {
        query = query.startAt(value);
      } else {
        query = query.startAt(value, key);
      }
    }
  }
}
