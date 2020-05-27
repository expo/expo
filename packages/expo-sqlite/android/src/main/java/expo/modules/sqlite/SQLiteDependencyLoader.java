package expo.modules.sqlite;

import android.content.Context;
import net.sqlcipher.database.SQLiteDatabase;
import org.unimodules.core.interfaces.SingletonModule;

public class SQLiteDependencyLoader implements SingletonModule {
  public String getName() {
    return "SQLiteDependencyLoader";
  }

  public SQLiteDependencyLoader(Context context) {
    SQLiteDatabase.loadLibs(context.getApplicationContext());
  }
}
