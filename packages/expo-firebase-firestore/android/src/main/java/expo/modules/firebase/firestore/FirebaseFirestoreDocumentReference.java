package expo.modules.firebase.firestore;

import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.EventListener;
import com.google.firebase.firestore.FirebaseFirestoreException;
import com.google.firebase.firestore.ListenerRegistration;
import com.google.firebase.firestore.MetadataChanges;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.firestore.Source;

import java.util.HashMap;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.modules.firebase.app.Utils;

public class FirebaseFirestoreDocumentReference {
  private static final String TAG = FirebaseFirestoreDocumentReference.class.getCanonicalName();
  private static Map<String, ListenerRegistration> documentSnapshotListeners = new HashMap<>();

  private final String appName;
  private final String path;
  private ModuleRegistry moduleRegistry;
  private final DocumentReference ref;

  FirebaseFirestoreDocumentReference(ModuleRegistry moduleRegistry, String appName, String path) {
    this.appName = appName;
    this.path = path;
    this.moduleRegistry = moduleRegistry;
    this.ref = FirebaseFirestoreModule.getFirestoreForApp(appName).document(path);
  }

  public void delete(final Promise promise) {
    this.ref.delete().addOnCompleteListener(new OnCompleteListener<Void>() {
      @Override
      public void onComplete(@NonNull Task<Void> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "delete:onComplete:success");
          promise.resolve(null);
        } else {
          Log.e(TAG, "delete:onComplete:failure", task.getException());
          FirebaseFirestoreModule.promiseRejectException(promise, (FirebaseFirestoreException) task.getException());
        }
      }
    });
  }

  void get(final Map<String, Object> getOptions, final Promise promise) {
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
    this.ref.get(source).addOnCompleteListener(new OnCompleteListener<DocumentSnapshot>() {
      @Override
      public void onComplete(@NonNull Task<DocumentSnapshot> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "get:onComplete:success");
          Bundle data = FirestoreSerialize.documentSnapshotToBundle(task.getResult());
          promise.resolve(data);
        } else {
          Log.e(TAG, "get:onComplete:failure", task.getException());
          FirebaseFirestoreModule.promiseRejectException(promise, (FirebaseFirestoreException) task.getException());
        }
      }
    });
  }

  public static void offSnapshot(final String listenerId) {
    ListenerRegistration listenerRegistration = documentSnapshotListeners.remove(listenerId);
    if (listenerRegistration != null) {
      listenerRegistration.remove();
    }
  }

  public void onSnapshot(final String listenerId, final Map<String, Object> docListenOptions) {
    if (!documentSnapshotListeners.containsKey(listenerId)) {
      final EventListener<DocumentSnapshot> listener = new EventListener<DocumentSnapshot>() {
        @Override
        public void onEvent(DocumentSnapshot documentSnapshot, FirebaseFirestoreException exception) {
          if (exception == null) {
            handleDocumentSnapshotEvent(listenerId, documentSnapshot);
          } else {
            ListenerRegistration listenerRegistration = documentSnapshotListeners.remove(listenerId);
            if (listenerRegistration != null) {
              listenerRegistration.remove();
            }
            handleDocumentSnapshotError(listenerId, exception);
          }
        }
      };
      MetadataChanges metadataChanges;
      if (docListenOptions != null && docListenOptions.containsKey("includeMetadataChanges")
          && (boolean) docListenOptions.get("includeMetadataChanges")) {
        metadataChanges = MetadataChanges.INCLUDE;
      } else {
        metadataChanges = MetadataChanges.EXCLUDE;
      }
      ListenerRegistration listenerRegistration = this.ref.addSnapshotListener(metadataChanges, listener);
      documentSnapshotListeners.put(listenerId, listenerRegistration);
    }
  }

  public void set(final Map<String, Object> data, final Map<String, Object> options, final Promise promise) {
    Map<String, Object> map = FirestoreSerialize.parseReadableMap(FirebaseFirestoreModule.getFirestoreForApp(appName), data);
    Task<Void> task;
    if (options != null && options.containsKey("merge") && (boolean) options.get("merge")) {
      task = this.ref.set(map, SetOptions.merge());
    } else {
      task = this.ref.set(map);
    }
    task.addOnCompleteListener(new OnCompleteListener<Void>() {
      @Override
      public void onComplete(@NonNull Task<Void> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "set:onComplete:success");
          promise.resolve(null);
        } else {
          Log.e(TAG, "set:onComplete:failure", task.getException());
          FirebaseFirestoreModule.promiseRejectException(promise, (FirebaseFirestoreException) task.getException());
        }
      }
    });
  }

  public void update(final Map<String, Object> data, final Promise promise) {
    Map<String, Object> map = FirestoreSerialize.parseReadableMap(FirebaseFirestoreModule.getFirestoreForApp(appName), data);
    this.ref.update(map).addOnCompleteListener(new OnCompleteListener<Void>() {
      @Override
      public void onComplete(@NonNull Task<Void> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "update:onComplete:success");
          promise.resolve(null);
        } else {
          Log.e(TAG, "update:onComplete:failure", task.getException());
          FirebaseFirestoreModule.promiseRejectException(promise, (FirebaseFirestoreException) task.getException());
        }
      }
    });
  }

  /*
   * INTERNALS/UTILS
   */

  public DocumentReference getRef() {
    return ref;
  }

  boolean hasListeners() {
    return !documentSnapshotListeners.isEmpty();
  }

  /**
   * Handles documentSnapshot events.
   *
   * @param listenerId
   * @param documentSnapshot
   */
  private void handleDocumentSnapshotEvent(String listenerId, DocumentSnapshot documentSnapshot) {
    Bundle event = new Bundle();
    Bundle data = FirestoreSerialize.documentSnapshotToBundle(documentSnapshot);

    event.putString("appName", appName);
    event.putString("path", path);
    event.putString("listenerId", listenerId);
    event.putBundle("documentSnapshot", data);

    Utils.sendEvent(moduleRegistry, "firestore_document_sync_event", event);
  }

  /**
   * Handles a documentSnapshot error event
   *
   * @param listenerId
   * @param exception
   */
  private void handleDocumentSnapshotError(String listenerId, FirebaseFirestoreException exception) {
    Bundle event = new Bundle();

    event.putString("appName", appName);
    event.putString("path", path);
    event.putString("listenerId", listenerId);
    event.putBundle("error", FirebaseFirestoreModule.getJSError(exception));

    Utils.sendEvent(moduleRegistry, "firestore_document_sync_event", event);
  }
}
