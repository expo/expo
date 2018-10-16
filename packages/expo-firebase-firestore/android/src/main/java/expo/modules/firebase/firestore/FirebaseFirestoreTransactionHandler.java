package expo.modules.firebase.firestore;

import android.os.Bundle;

import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestoreException;
import com.google.firebase.firestore.Transaction;

import java.util.ArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

import javax.annotation.Nullable;

import expo.core.Promise;

class FirebaseFirestoreTransactionHandler {
  private String appName;
  private long timeoutAt;
  private int transactionId;
  private final ReentrantLock lock;
  private final Condition condition;
  private ArrayList commandBuffer;
  private Transaction firestoreTransaction;

  boolean aborted = false;
  boolean timeout = false;

  FirebaseFirestoreTransactionHandler(String app, int id) {
    appName = app;
    transactionId = id;
    updateInternalTimeout();
    lock = new ReentrantLock();
    condition = lock.newCondition();
  }

  /*
   * ------------- PACKAGE API -------------
   */

  /**
   * Abort the currently in progress transaction if any.
   */
  void abort() {
    aborted = true;
    safeUnlock();
  }

  /**
   * Reset handler state - clears command buffer + updates to new Transaction
   * instance
   *
   * @param firestoreTransaction
   */
  void resetState(Transaction firestoreTransaction) {
    this.commandBuffer = null;
    this.firestoreTransaction = firestoreTransaction;
  }

  /**
   * Signal that the transaction buffer has been received and needs to be
   * processed.
   *
   * @param buffer
   */
  void signalBufferReceived(ArrayList buffer) {
    lock.lock();

    try {
      commandBuffer = buffer;
      condition.signalAll();
    } finally {
      safeUnlock();
    }
  }

  /**
   * Wait for signalBufferReceived to signal condition
   *
   * @throws InterruptedException
   */
  void await() {
    lock.lock();

    updateInternalTimeout();

    try {
      while (!aborted && !timeout && !condition.await(10, TimeUnit.MILLISECONDS)) {
        if (System.currentTimeMillis() > timeoutAt)
          timeout = true;
      }
    } catch (InterruptedException ie) {
      // should never be interrupted
    } finally {
      safeUnlock();
    }
  }

  /**
   * Get the current pending command buffer.
   *
   * @return
   */
  ArrayList getCommandBuffer() {
    return commandBuffer;
  }

  /**
   * Get and resolve a DocumentSnapshot from transaction.get(ref);
   *
   * @param ref
   * @param promise
   */
  void getDocument(DocumentReference ref, Promise promise) {
    updateInternalTimeout();

    try {
      DocumentSnapshot documentSnapshot = firestoreTransaction.get(ref);
      Bundle writableMap = FirestoreSerialize.documentSnapshotToBundle(documentSnapshot);
      promise.resolve(writableMap);
    } catch (FirebaseFirestoreException firestoreException) {
      Bundle jsError = FirebaseFirestoreModule.getJSError(firestoreException);
      promise.reject(jsError.getString("code"), jsError.getString("message"));
    }
  }

  /**
   * Event map for `firestore_transaction_event` events.
   *
   * @param error
   * @param type
   * @return
   */
  Bundle createEventMap(@Nullable FirebaseFirestoreException error, String type) {
    Bundle eventMap = new Bundle();

    eventMap.putInt("id", transactionId);
    eventMap.putString("appName", appName);

    if (error != null) {
      eventMap.putString("type", "error");
      eventMap.putBundle("error", FirebaseFirestoreModule.getJSError(error));
    } else {
      eventMap.putString("type", type);
    }

    return eventMap;
  }

  /*
   * ------------- INTERNAL API -------------
   */

  private void safeUnlock() {
    if (lock.isLocked()) {
      lock.unlock();
    }
  }

  private void updateInternalTimeout() {
    timeoutAt = System.currentTimeMillis() + 15000;
  }
}
