package versioned.host.exp.exponent.modules.api.notifications;

import android.arch.persistence.db.SupportSQLiteOpenHelper;
import android.arch.persistence.room.Database;
import android.arch.persistence.room.DatabaseConfiguration;
import android.arch.persistence.room.InvalidationTracker;
import android.arch.persistence.room.RoomDatabase;
import android.support.annotation.NonNull;

@Database(entities = {ActionObject.class}, version = 1, exportSchema = false)
public abstract class ActionDatabase extends RoomDatabase {
  public abstract ActionObjectDao mActionObjectDao();
}

