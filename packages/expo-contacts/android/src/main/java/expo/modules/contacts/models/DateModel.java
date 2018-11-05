package expo.modules.contacts.models;

import android.database.Cursor;
import android.provider.ContactsContract;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import java.util.Map;

import expo.modules.contacts.EXColumns;

import static android.provider.ContactsContract.*;

public class DateModel extends BaseModel {

    @Override
    public String getContentType() {
        return CommonDataKinds.Event.CONTENT_ITEM_TYPE;
    }

    @Override
    public String getDataAlias() {
        return "date";
    }

    @Override
    public int mapStringToType(String label) {
        switch (label) {
        case "anniversary":
            return CommonDataKinds.Event.TYPE_ANNIVERSARY;
        case "birthday":
            return CommonDataKinds.Event.TYPE_BIRTHDAY;
        case "other":
            return CommonDataKinds.Event.TYPE_OTHER;
        default:
            return EXColumns.TYPE_CUSTOM;
        }
    }

    @Override
    public void fromMap(Map<String, Object> readableMap) {
        super.fromMap(readableMap);

        String dateString = (String) readableMap.get("date");

        Boolean hasYear = !dateString.startsWith("--");
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat datePattern = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        SimpleDateFormat noYearPattern = new SimpleDateFormat("--MM-dd", Locale.getDefault());

        try {
            if (hasYear) {
                calendar.setTime(datePattern.parse(dateString));
            } else {
                calendar.setTime(noYearPattern.parse(dateString));
            }
        } catch (Exception e) {
            // TODO: ??
        }

        if (hasYear) {
            map.putInt("year", calendar.get(Calendar.YEAR));
        }
        map.putInt("month", calendar.get(Calendar.MONTH) + 1);
        map.putInt("day", calendar.get(Calendar.DAY_OF_MONTH));
    }

    @Override
    protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null)
            return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
        case CommonDataKinds.Event.TYPE_ANNIVERSARY:
            return "anniversary";
        case CommonDataKinds.Event.TYPE_BIRTHDAY:
            return "birthday";
        case CommonDataKinds.Event.TYPE_OTHER:
            return "other";
        default:
            return "unknown";
        }
    }
}