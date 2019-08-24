package host.exp.exponent.notifications;

import com.raizlabs.android.dbflow.annotation.Database;
import com.raizlabs.android.dbflow.annotation.Migration;
import com.raizlabs.android.dbflow.sql.SQLiteType;
import com.raizlabs.android.dbflow.sql.migration.AlterTableMigration;

@Database(version = ActionDatabase.VERSION)
public class ActionDatabase {
  public static final String NAME = "ExpoNotificationActions";
  public static final int VERSION = 2;

  @Migration(version = 2, database = ActionDatabase.class)
  public static class Migration2 extends AlterTableMigration<ActionObject> {

    public Migration2(Class<ActionObject> table) {
      super(table);
    }

    @Override
    public void onPreMigrate() {
      addColumn(SQLiteType.INTEGER, "isBackgroundAction");
    }
  }
}
