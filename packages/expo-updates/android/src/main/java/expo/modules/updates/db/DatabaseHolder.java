package expo.modules.updates.db;

import android.util.Log;

public class DatabaseHolder {

  private static final String TAG = DatabaseHolder.class.getSimpleName();

  private UpdatesDatabase mDatabase;
  private boolean isInUse = false;

  public DatabaseHolder(UpdatesDatabase database) {
    mDatabase = database;
  }

  public synchronized UpdatesDatabase getDatabase() {
    while (isInUse) {
      try {
        wait();
      } catch (InterruptedException e) {
        Log.e(TAG, "Interrupted while waiting for database", e);
      }
    }

    isInUse = true;
    return mDatabase;
  }

  public synchronized void releaseDatabase() {
    isInUse = false;
    notify();
  }
}
