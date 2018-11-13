package expo.modules.firebase.firestore;

import android.os.AsyncTask;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.google.firebase.firestore.DocumentSnapshot;

import java.lang.ref.WeakReference;

class DocumentSnapshotSerializeAsyncTask extends AsyncTask<Object, Void, WritableMap> {
  private WeakReference<ReactContext> reactContextWeakReference;
  private WeakReference<RNFirebaseFirestoreDocumentReference> referenceWeakReference;

  DocumentSnapshotSerializeAsyncTask(
    ReactContext context,
    RNFirebaseFirestoreDocumentReference reference
  ) {
    referenceWeakReference = new WeakReference<>(reference);
    reactContextWeakReference = new WeakReference<>(context);
  }

  @Override
  protected final WritableMap doInBackground(Object... params) {
    DocumentSnapshot querySnapshot = (DocumentSnapshot) params[0];

    try {
      return FirestoreSerialize.snapshotToWritableMap(querySnapshot);
    } catch (RuntimeException e) {
      if (isAvailable()) {
        reactContextWeakReference
          .get()
          .handleException(e);
      } else {
        throw e;
      }
      return null;
    }
  }

  @Override
  protected void onPostExecute(WritableMap writableMap) {
    // do nothing as overridden on usage
  }

  private Boolean isAvailable() {
    return reactContextWeakReference.get() != null && referenceWeakReference.get() != null;
  }
}