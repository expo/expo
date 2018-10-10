package expo.modules.firebase.firestore;

import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.firestore.EventListener;
import com.google.firebase.firestore.FieldPath;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.FirebaseFirestoreException;
import com.google.firebase.firestore.ListenerRegistration;
import com.google.firebase.firestore.MetadataChanges;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.firestore.Source;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.modules.firebase.app.Utils;

public class FirebaseFirestoreCollectionReference {
  private static final String TAG = FirebaseFirestoreCollectionReference.class.getCanonicalName();
  private static Map<String, ListenerRegistration> collectionSnapshotListeners = new HashMap<>();

  private final String appName;
  private final String path;
  private final ArrayList filters;
  private final ArrayList orders;
  private final Map<String, Object> options;
  private final Query query;

  private final ModuleRegistry moduleRegistry;

  FirebaseFirestoreCollectionReference(ModuleRegistry moduleRegistry, String appName, String path, ArrayList filters,
                                       ArrayList orders, Map<String, Object> options) {
    this.appName = appName;
    this.path = path;
    this.filters = filters;
    this.orders = orders;
    this.options = options;
    this.query = buildQuery();
    this.moduleRegistry = moduleRegistry;
  }

  void get(Map<String, Object> getOptions, final Promise promise) {
    Source source;
    if (getOptions != null && getOptions.containsKey("source")) {
      String optionsSource = (String) getOptions.get("source");
      if ("server".equals(optionsSource)) {
        source = Source.SERVER;
      } else if ("cache".equals(optionsSource)) {
        source = Source.CACHE;
      } else {
        source = Source.DEFAULT;
      }
    } else {
      source = Source.DEFAULT;
    }
    query.get(source).addOnCompleteListener(new OnCompleteListener<QuerySnapshot>() {
      @Override
      public void onComplete(@NonNull Task<QuerySnapshot> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "get:onComplete:success");
          Bundle data = FirestoreSerialize.querySnapshotToBundle(task.getResult());
          promise.resolve(data);
        } else {
          Log.e(TAG, "get:onComplete:failure", task.getException());
          FirebaseFirestoreModule.promiseRejectException(promise, (FirebaseFirestoreException) task.getException());
        }
      }
    });
  }

  public static void offSnapshot(final String listenerId) {
    ListenerRegistration listenerRegistration = collectionSnapshotListeners.remove(listenerId);
    if (listenerRegistration != null) {
      listenerRegistration.remove();
    }
  }

  public void onSnapshot(final String listenerId, final Map<String, Object> queryListenOptions) {
    if (!collectionSnapshotListeners.containsKey(listenerId)) {
      final EventListener<QuerySnapshot> listener = new EventListener<QuerySnapshot>() {
        @Override
        public void onEvent(QuerySnapshot querySnapshot, FirebaseFirestoreException exception) {
          if (exception == null) {
            handleQuerySnapshotEvent(listenerId, querySnapshot);
          } else {
            ListenerRegistration listenerRegistration = collectionSnapshotListeners.remove(listenerId);
            if (listenerRegistration != null) {
              listenerRegistration.remove();
            }
            handleQuerySnapshotError(listenerId, exception);
          }
        }
      };
      MetadataChanges metadataChanges;

      if (queryListenOptions != null && queryListenOptions.containsKey("includeMetadataChanges")
          && (boolean) queryListenOptions.get("includeMetadataChanges")) {
        metadataChanges = MetadataChanges.INCLUDE;
      } else {
        metadataChanges = MetadataChanges.EXCLUDE;
      }

      ListenerRegistration listenerRegistration = this.query.addSnapshotListener(metadataChanges, listener);
      collectionSnapshotListeners.put(listenerId, listenerRegistration);
    }
  }

  /*
   * INTERNALS/UTILS
   */

  boolean hasListeners() {
    return !collectionSnapshotListeners.isEmpty();
  }

  private Query buildQuery() {
    FirebaseFirestore firestore = FirebaseFirestoreModule.getFirestoreForApp(appName);
    Query query = firestore.collection(path);
    query = applyFilters(firestore, query);
    query = applyOrders(query);
    query = applyOptions(firestore, query);

    return query;
  }

  private Query applyFilters(FirebaseFirestore firestore, Query query) {
    for (int i = 0; i < filters.size(); i++) {
      Map<String, Object> filter = (Map<String, Object>) filters.get(i);
      Map<String, Object> fieldPathMap = (Map<String, Object>) filter.get("fieldPath");
      String fieldPathType = (String) fieldPathMap.get("type");

      String operator = (String) filter.get("operator");
      Map<String, Object> jsValue = (Map<String, Object>) filter.get("value");
      Object value = FirestoreSerialize.parseTypeMap(firestore, jsValue);

      if (fieldPathType.equals("string")) {
        String fieldPath = (String) fieldPathMap.get("string");
        switch (operator) {
        case "EQUAL":
          query = query.whereEqualTo(fieldPath, value);
          break;
        case "GREATER_THAN":
          query = query.whereGreaterThan(fieldPath, value);
          break;
        case "GREATER_THAN_OR_EQUAL":
          query = query.whereGreaterThanOrEqualTo(fieldPath, value);
          break;
        case "LESS_THAN":
          query = query.whereLessThan(fieldPath, value);
          break;
        case "LESS_THAN_OR_EQUAL":
          query = query.whereLessThanOrEqualTo(fieldPath, value);
          break;
        }
      } else {
        ArrayList fieldPathElements = (ArrayList) fieldPathMap.get("elements");
        String[] fieldPathArray = new String[fieldPathElements.size()];
        for (int j = 0; j < fieldPathElements.size(); j++) {
          fieldPathArray[j] = (String) fieldPathElements.get(j);
        }
        FieldPath fieldPath = FieldPath.of(fieldPathArray);
        switch (operator) {
        case "EQUAL":
          query = query.whereEqualTo(fieldPath, value);
          break;
        case "GREATER_THAN":
          query = query.whereGreaterThan(fieldPath, value);
          break;
        case "GREATER_THAN_OR_EQUAL":
          query = query.whereGreaterThanOrEqualTo(fieldPath, value);
          break;
        case "LESS_THAN":
          query = query.whereLessThan(fieldPath, value);
          break;
        case "LESS_THAN_OR_EQUAL":
          query = query.whereLessThanOrEqualTo(fieldPath, value);
          break;
        }
      }
    }
    return query;
  }

  private Query applyOrders(Query query) {
    List<Object> ordersList = Utils.recursivelyDeconstructReadableArray(orders);
    for (Object o : ordersList) {
      Map<String, Object> order = (Map) o;
      String direction = (String) order.get("direction");
      Map<String, Object> fieldPathMap = (Map) order.get("fieldPath");
      String fieldPathType = (String) fieldPathMap.get("type");

      if (fieldPathType.equals("string")) {
        String fieldPath = (String) fieldPathMap.get("string");
        query = query.orderBy(fieldPath, Query.Direction.valueOf(direction));
      } else {
        List<String> fieldPathElements = (List) fieldPathMap.get("elements");
        FieldPath fieldPath = FieldPath.of(fieldPathElements.toArray(new String[fieldPathElements.size()]));
        query = query.orderBy(fieldPath, Query.Direction.valueOf(direction));
      }
    }
    return query;
  }

  private Query applyOptions(FirebaseFirestore firestore, Query query) {
    if (options.containsKey("endAt")) {
      List<Object> endAtList = FirestoreSerialize.parseReadableArray(firestore, (List) options.get("endAt"));
      query = query.endAt(endAtList.toArray());
    }
    if (options.containsKey("endBefore")) {
      List<Object> endBeforeList = FirestoreSerialize.parseReadableArray(firestore, (List) options.get("endBefore"));
      query = query.endBefore(endBeforeList.toArray());
    }
    if (options.containsKey("limit")) {
      int limit = ((Number) options.get("limit")).intValue();
      query = query.limit(limit);
    }
    if (options.containsKey("offset")) {
      // Android doesn't support offset
    }
    if (options.containsKey("selectFields")) {
      // Android doesn't support selectFields
    }
    if (options.containsKey("startAfter")) {
      List<Object> startAfterList = FirestoreSerialize.parseReadableArray(firestore, (List) options.get("startAfter"));
      query = query.startAfter(startAfterList.toArray());
    }
    if (options.containsKey("startAt")) {
      List<Object> startAtList = FirestoreSerialize.parseReadableArray(firestore, (List) options.get("startAt"));
      query = query.startAt(startAtList.toArray());
    }
    return query;
  }

  /**
   * Handles documentSnapshot events.
   *
   * @param listenerId
   * @param querySnapshot
   */
  private void handleQuerySnapshotEvent(String listenerId, QuerySnapshot querySnapshot) {
    Bundle event = new Bundle();
    Bundle data = FirestoreSerialize.querySnapshotToBundle(querySnapshot);

    event.putString("appName", appName);
    event.putString("path", path);
    event.putString("listenerId", listenerId);
    event.putBundle("querySnapshot", data);

    Utils.sendEvent(moduleRegistry, "firestore_collection_sync_event", event);
  }

  /**
   * Handles a documentSnapshot error event
   *
   * @param listenerId
   * @param exception
   */
  private void handleQuerySnapshotError(String listenerId, FirebaseFirestoreException exception) {
    Bundle event = new Bundle();

    event.putString("appName", appName);
    event.putString("path", path);
    event.putString("listenerId", listenerId);
    event.putBundle("error", FirebaseFirestoreModule.getJSError(exception));

    Utils.sendEvent(moduleRegistry, "firestore_collection_sync_event", event);
  }
}
