package expo.modules.firebase.database;

import android.os.Bundle;
import android.os.Parcelable;
import android.support.annotation.Nullable;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.MutableData;

import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

import expo.modules.firebase.app.Utils;

public class FirebaseTransactionHandler {
  private int transactionId;
  private String appName;
  private String dbURL;
  private final ReentrantLock lock;
  private final Condition condition;
  private Map<String, Object> data;
  private boolean signalled;

  public Object value;
  boolean interrupted;
  boolean abort = false;
  boolean timeout = false;

  FirebaseTransactionHandler(int id, String app, String url) {
    appName = app;
    dbURL = url;
    transactionId = id;
    lock = new ReentrantLock();
    condition = lock.newCondition();
  }

  /**
   * Signal that the transaction data has been received
   *
   * @param updates
   */
  void signalUpdateReceived(Map<String, Object> updates) {
    Map<String, Object> updateData = updates;

    lock.lock();
    value = updateData.get("value");
    abort = (Boolean) updateData.get("abort");

    try {
      if (signalled) {
        throw new IllegalStateException("This transactionUpdateHandler has already been signalled.");
      }

      signalled = true;
      data = updateData;
      condition.signalAll();
    } finally {
      lock.unlock();
    }
  }

  /**
   * Wait for signalUpdateReceived to signal condition
   *
   * @throws InterruptedException
   */
  void await() throws InterruptedException {
    lock.lock();

    long timeoutExpired = System.currentTimeMillis() + 5000;

    try {
      while (!timeout && !condition.await(250, TimeUnit.MILLISECONDS) && !signalled) {
        if (!signalled && System.currentTimeMillis() > timeoutExpired) {
          timeout = true;
        }
      }
    } finally {
      lock.unlock();
    }
  }

  /**
   * Get the
   *
   * @return
   */
  Map<String, Object> getUpdates() {
    return data;
  }

  /**
   * Create a RN map of transaction mutable data for sending to js
   *
   * @param updatesData
   * @return
   */
  Bundle createUpdateMap(MutableData updatesData) {
    final Bundle updatesMap = new Bundle();

    updatesMap.putInt("id", transactionId);
    updatesMap.putString("type", "update");

    // all events get distributed js side based on app name
    updatesMap.putString("appName", appName);
    updatesMap.putString("dbURL", dbURL);

    if (!updatesData.hasChildren()) {
      Utils.mapPutValue("value", updatesData.getValue(), updatesMap);
    } else {
      Object value = FirebaseDatabaseUtils.castValue(updatesData);

      if (value instanceof ArrayList) {
        updatesMap.putParcelableArrayList("value", (ArrayList<? extends Parcelable>) value);
      } else {
        updatesMap.putBundle("value", (Bundle) value);
      }
    }

    return updatesMap;
  }


  Bundle createResultMap(@Nullable DatabaseError error, boolean committed, DataSnapshot snapshot) {
    Bundle resultMap = new Bundle();

    resultMap.putInt("id", transactionId);
    resultMap.putString("appName", appName);
    resultMap.putString("dbURL", dbURL);

    resultMap.putBoolean("timeout", timeout);
    resultMap.putBoolean("committed", committed);
    resultMap.putBoolean("interrupted", interrupted);

    if (error != null || timeout || interrupted) {
      resultMap.putString("type", "error");
      if (error != null) resultMap.putBundle("error", FirebaseDatabaseModule.getJSError(error));
      if (error == null && timeout) {
        Bundle timeoutError = new Bundle();
        timeoutError.putString("code", "DATABASE/INTERNAL-TIMEOUT");
        timeoutError.putString("message", "A timeout occurred whilst waiting for RN JS thread to send transaction updates.");
        resultMap.putBundle("error", timeoutError);
      }
    } else {
      resultMap.putString("type", "complete");
      resultMap.putBundle("snapshot", FirebaseDatabaseUtils.snapshotToMap(snapshot));
    }

    return resultMap;
  }
}
