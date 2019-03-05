package expo.modules.firebase.firestore;

import android.os.AsyncTask;
import android.os.Bundle;

import com.google.firebase.firestore.DocumentSnapshot;

import java.lang.ref.WeakReference;

import org.unimodules.core.ModuleRegistry;

class DocumentSnapshotSerializeAsyncTask extends AsyncTask<Object, Void, Bundle> {
  private WeakReference<ModuleRegistry> reactContextWeakReference;
  private WeakReference<FirebaseFirestoreDocumentReference> referenceWeakReference;

  DocumentSnapshotSerializeAsyncTask(
    ModuleRegistry context,
    FirebaseFirestoreDocumentReference reference
  ) {
    referenceWeakReference = new WeakReference<>(reference);
    reactContextWeakReference = new WeakReference<>(context);
  }

  @Override
  protected final Bundle doInBackground(Object... params) {
    DocumentSnapshot querySnapshot = (DocumentSnapshot) params[0];

    try {
      return FirestoreSerialize.snapshotToBundle(querySnapshot);
    } catch (RuntimeException e) {
      if (isAvailable()) {
//        reactContextWeakReference
//          .get()
//          .handleException(e);
      } else {
        throw e;
      }
      return null;
    }
  }

  @Override
  protected void onPostExecute(Bundle writableMap) {
    // do nothing as overridden on usage
  }

  private Boolean isAvailable() {
    return reactContextWeakReference.get() != null && referenceWeakReference.get() != null;
  }
}
