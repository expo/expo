package host.exp.exponent.notifications.schedulers;

import android.content.ContentValues;
import android.database.Cursor;
import com.raizlabs.android.dbflow.config.FlowManager;
import com.raizlabs.android.dbflow.sql.builder.Condition;
import com.raizlabs.android.dbflow.sql.builder.ConditionQueryBuilder;
import com.raizlabs.android.dbflow.sql.language.Select;
import com.raizlabs.android.dbflow.structure.ModelAdapter;
// This table belongs to the SchedulersDatabase database
public final class CalendarScheduler$Adapter extends ModelAdapter<CalendarScheduler> {

  @Override
  public Class<CalendarScheduler> getModelClass() {
    return CalendarScheduler.class;
  }

  @Override
  public String getTableName() {
    return host.exp.exponent.notifications.schedulers.CalendarScheduler$Table.TABLE_NAME;
  }

  @Override
  protected final String getInsertStatementQuery() {
    return "INSERT INTO `CalendarScheduler` (`ID`, `NOTIFICATIONID`, `EXPERIENCEID`, `REPEAT`, `SCHEDULED`, `SERIALIZEDDETAILS`, `CALENDARDATA`) VALUES (?, ?, ?, ?, ?, ?, ?)";
  }

  @Override
  public void bindToStatement(android.database.sqlite.SQLiteStatement statement, CalendarScheduler model) {
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
    if (((java.lang.String)model.calendarData) != null)  {
      statement.bindString(7,((java.lang.String)model.calendarData));
    } else {
      statement.bindNull(7);
    }

  }

  @Override
  public void bindToContentValues(ContentValues contentValues, CalendarScheduler model) {
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
    if (((java.lang.String)model.calendarData) != null)  {
      contentValues.put("calendarData",((java.lang.String)model.calendarData));
    } else {
      contentValues.putNull("calendarData");
    }

  }

  @Override
  public void bindToInsertValues(ContentValues contentValues, CalendarScheduler model) {
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
    if (((java.lang.String)model.calendarData) != null)  {
      contentValues.put("calendarData",((java.lang.String)model.calendarData));
    } else {
      contentValues.putNull("calendarData");
    }

  }

  @Override
  public boolean exists(CalendarScheduler model) {
    return new Select().from(CalendarScheduler.class).where(getPrimaryModelWhere(model)).hasData();
  }

  @Override
  public void loadFromCursor(Cursor cursor, CalendarScheduler model) {
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
    int indexcalendarData = cursor.getColumnIndex("calendarData");
    if (indexcalendarData != -1)  {
      if (cursor.isNull(indexcalendarData)) {
        model.calendarData = null;
      } else {
        model.calendarData = cursor.getString(indexcalendarData);
      }
    }
  }

  @Override
  public boolean hasCachingId() {
    return true;
  }

  @Override
  public Object getCachingId(CalendarScheduler model) {
    return model.id;
  }

  @Override
  public String getCachingColumnName() {
    return CalendarScheduler$Table.ID;
  }

  @Override
  public Object getCachingIdFromCursorIndex(Cursor cursor, int indexid) {
    return cursor.getInt(indexid);
  }

  @Override
  public ConditionQueryBuilder<CalendarScheduler> getPrimaryModelWhere(CalendarScheduler model) {
    return new ConditionQueryBuilder<CalendarScheduler>(CalendarScheduler.class, Condition.column(CalendarScheduler$Table.ID).is((model.id)));
  }

  @Override
  public ConditionQueryBuilder<CalendarScheduler> createPrimaryModelWhere() {
    return new ConditionQueryBuilder<CalendarScheduler>(CalendarScheduler.class, Condition.column(CalendarScheduler$Table.ID).is("?"));
  }

  @Override
  public String getCreationQuery() {
    return "CREATE TABLE IF NOT EXISTS `CalendarScheduler`(`id` INTEGER, `notificationId` INTEGER, `experienceId` TEXT, `repeat` INTEGER, `scheduled` INTEGER, `serializedDetails` TEXT, `calendarData` TEXT, PRIMARY KEY(`id`));";
  }

  @Override
  public final CalendarScheduler newInstance() {
    return new host.exp.exponent.notifications.schedulers.CalendarScheduler();
  }
}
