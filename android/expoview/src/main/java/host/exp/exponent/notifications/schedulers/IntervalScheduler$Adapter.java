package host.exp.exponent.notifications.schedulers;

import android.content.ContentValues;
import android.database.Cursor;
import com.raizlabs.android.dbflow.config.FlowManager;
import com.raizlabs.android.dbflow.sql.builder.Condition;
import com.raizlabs.android.dbflow.sql.builder.ConditionQueryBuilder;
import com.raizlabs.android.dbflow.sql.language.Select;
import com.raizlabs.android.dbflow.structure.ModelAdapter;
// This table belongs to the SchedulersDatabase database
public final class IntervalScheduler$Adapter extends ModelAdapter<IntervalScheduler> {

  @Override
  public Class<IntervalScheduler> getModelClass() {
    return IntervalScheduler.class;
  }

  @Override
  public String getTableName() {
    return host.exp.exponent.notifications.schedulers.IntervalScheduler$Table.TABLE_NAME;
  }

  @Override
  protected final String getInsertStatementQuery() {
    return "INSERT INTO `IntervalScheduler` (`ID`, `NOTIFICATIONID`, `EXPERIENCEID`, `REPEAT`, `SCHEDULED`, `SERIALIZEDDETAILS`, `SCHEDULEDTIME`, `INTERVAL`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  }

  @Override
  public void bindToStatement(android.database.sqlite.SQLiteStatement statement, IntervalScheduler model) {
    statement.bindLong(1,((int)model.id));
    statement.bindLong(2,((int)model.notificationId));
    if (((java.lang.String)model.experienceId) != null)  {
      statement.bindString(3,((java.lang.String)model.experienceId));
    } else {
      statement.bindNull(3);
    }
    Object modelrepeat = FlowManager.getTypeConverterForClass(java.lang.Boolean.class).getDBValue(model.repeat);
    if (modelrepeat != null)  {
      statement.bindLong(4,((java.lang.Integer)modelrepeat));
    } else {
      statement.bindNull(4);
    }
    Object modelscheduled = FlowManager.getTypeConverterForClass(java.lang.Boolean.class).getDBValue(model.scheduled);
    if (modelscheduled != null)  {
      statement.bindLong(5,((java.lang.Integer)modelscheduled));
    } else {
      statement.bindNull(5);
    }
    if (((java.lang.String)model.serializedDetails) != null)  {
      statement.bindString(6,((java.lang.String)model.serializedDetails));
    } else {
      statement.bindNull(6);
    }
    statement.bindLong(7,((long)model.scheduledTime));
    statement.bindLong(8,((long)model.interval));

  }

  @Override
  public void bindToContentValues(ContentValues contentValues, IntervalScheduler model) {
    contentValues.put("id",((int)model.id));
    contentValues.put("notificationId",((int)model.notificationId));
    if (((java.lang.String)model.experienceId) != null)  {
      contentValues.put("experienceId",((java.lang.String)model.experienceId));
    } else {
      contentValues.putNull("experienceId");
    }
    Object modelrepeat = FlowManager.getTypeConverterForClass(java.lang.Boolean.class).getDBValue(model.repeat);
    if (modelrepeat != null)  {
      contentValues.put("repeat",((java.lang.Integer)modelrepeat));
    } else {
      contentValues.putNull("repeat");
    }
    Object modelscheduled = FlowManager.getTypeConverterForClass(java.lang.Boolean.class).getDBValue(model.scheduled);
    if (modelscheduled != null)  {
      contentValues.put("scheduled",((java.lang.Integer)modelscheduled));
    } else {
      contentValues.putNull("scheduled");
    }
    if (((java.lang.String)model.serializedDetails) != null)  {
      contentValues.put("serializedDetails",((java.lang.String)model.serializedDetails));
    } else {
      contentValues.putNull("serializedDetails");
    }
    contentValues.put("scheduledTime",((long)model.scheduledTime));
    contentValues.put("interval",((long)model.interval));

  }

  @Override
  public void bindToInsertValues(ContentValues contentValues, IntervalScheduler model) {
    contentValues.put("id",((int)model.id));
    contentValues.put("notificationId",((int)model.notificationId));
    if (((java.lang.String)model.experienceId) != null)  {
      contentValues.put("experienceId",((java.lang.String)model.experienceId));
    } else {
      contentValues.putNull("experienceId");
    }
    Object modelrepeat = FlowManager.getTypeConverterForClass(java.lang.Boolean.class).getDBValue(model.repeat);
    if (modelrepeat != null)  {
      contentValues.put("repeat",((java.lang.Integer)modelrepeat));
    } else {
      contentValues.putNull("repeat");
    }
    Object modelscheduled = FlowManager.getTypeConverterForClass(java.lang.Boolean.class).getDBValue(model.scheduled);
    if (modelscheduled != null)  {
      contentValues.put("scheduled",((java.lang.Integer)modelscheduled));
    } else {
      contentValues.putNull("scheduled");
    }
    if (((java.lang.String)model.serializedDetails) != null)  {
      contentValues.put("serializedDetails",((java.lang.String)model.serializedDetails));
    } else {
      contentValues.putNull("serializedDetails");
    }
    contentValues.put("scheduledTime",((long)model.scheduledTime));
    contentValues.put("interval",((long)model.interval));

  }

  @Override
  public boolean exists(IntervalScheduler model) {
    return new Select().from(IntervalScheduler.class).where(getPrimaryModelWhere(model)).hasData();
  }

  @Override
  public void loadFromCursor(Cursor cursor, IntervalScheduler model) {
    int indexid = cursor.getColumnIndex("id");
    if (indexid != -1)  {
      model.id = cursor.getInt(indexid);
    }
    int indexnotificationId = cursor.getColumnIndex("notificationId");
    if (indexnotificationId != -1)  {
      model.notificationId = cursor.getInt(indexnotificationId);
    }
    int indexexperienceId = cursor.getColumnIndex("experienceId");
    if (indexexperienceId != -1)  {
      if (cursor.isNull(indexexperienceId)) {
        model.experienceId = null;
      } else {
        model.experienceId = cursor.getString(indexexperienceId);
      }
    }
    int indexrepeat = cursor.getColumnIndex("repeat");
    if (indexrepeat != -1)  {
      model.repeat = ((java.lang.Boolean)FlowManager.getTypeConverterForClass(java.lang.Boolean.class).getModelValue(cursor.getInt(indexrepeat)));
    }
    int indexscheduled = cursor.getColumnIndex("scheduled");
    if (indexscheduled != -1)  {
      model.scheduled = ((java.lang.Boolean)FlowManager.getTypeConverterForClass(java.lang.Boolean.class).getModelValue(cursor.getInt(indexscheduled)));
    }
    int indexserializedDetails = cursor.getColumnIndex("serializedDetails");
    if (indexserializedDetails != -1)  {
      if (cursor.isNull(indexserializedDetails)) {
        model.serializedDetails = null;
      } else {
        model.serializedDetails = cursor.getString(indexserializedDetails);
      }
    }
    int indexscheduledTime = cursor.getColumnIndex("scheduledTime");
    if (indexscheduledTime != -1)  {
      model.scheduledTime = cursor.getLong(indexscheduledTime);
    }
    int indexinterval = cursor.getColumnIndex("interval");
    if (indexinterval != -1)  {
      model.interval = cursor.getLong(indexinterval);
    }
  }

  @Override
  public boolean hasCachingId() {
    return true;
  }

  @Override
  public Object getCachingId(IntervalScheduler model) {
    return model.id;
  }

  @Override
  public String getCachingColumnName() {
    return IntervalScheduler$Table.ID;
  }

  @Override
  public Object getCachingIdFromCursorIndex(Cursor cursor, int indexid) {
    return cursor.getInt(indexid);
  }

  @Override
  public ConditionQueryBuilder<IntervalScheduler> getPrimaryModelWhere(IntervalScheduler model) {
    return new ConditionQueryBuilder<IntervalScheduler>(IntervalScheduler.class, Condition.column(IntervalScheduler$Table.ID).is((model.id)));
  }

  @Override
  public ConditionQueryBuilder<IntervalScheduler> createPrimaryModelWhere() {
    return new ConditionQueryBuilder<IntervalScheduler>(IntervalScheduler.class, Condition.column(IntervalScheduler$Table.ID).is("?"));
  }

  @Override
  public String getCreationQuery() {
    return "CREATE TABLE IF NOT EXISTS `IntervalScheduler`(`id` INTEGER, `notificationId` INTEGER, `experienceId` TEXT, `repeat` INTEGER, `scheduled` INTEGER, `serializedDetails` TEXT, `scheduledTime` INTEGER, `interval` INTEGER, PRIMARY KEY(`id`));";
  }

  @Override
  public final IntervalScheduler newInstance() {
    return new host.exp.exponent.notifications.schedulers.IntervalScheduler();
  }
}
