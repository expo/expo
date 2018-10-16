package expo.modules.contacts.models;

import android.database.Cursor;
import android.provider.ContactsContract;

import java.util.Map;

import expo.modules.contacts.EXColumns;

import static android.provider.ContactsContract.*;

public class ExtraNameModel extends BaseModel {

    @Override
    public String getContentType() {
        return CommonDataKinds.Nickname.CONTENT_ITEM_TYPE;
    }

    @Override
    public String getDataAlias() {
        return "value";
    }

    @Override
    public int mapStringToType(String label) {
        switch (label) {
        case "default":
            return CommonDataKinds.Nickname.TYPE_DEFAULT;
        case "initials":
            return CommonDataKinds.Nickname.TYPE_INITIALS;
        case "maidenName":
            return CommonDataKinds.Nickname.TYPE_MAIDEN_NAME;
        case "shortName":
            return CommonDataKinds.Nickname.TYPE_SHORT_NAME;
        case "otherName":
            return CommonDataKinds.Nickname.TYPE_OTHER_NAME;
        default:
            return CommonDataKinds.Nickname.TYPE_CUSTOM;
        }
    }

    @Override
    protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null)
            return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
        case CommonDataKinds.Nickname.TYPE_DEFAULT:
            return "nickname";
        case CommonDataKinds.Nickname.TYPE_INITIALS:
            return "initials";
        case CommonDataKinds.Nickname.TYPE_MAIDEN_NAME:
            return "maidenName";
        case CommonDataKinds.Nickname.TYPE_SHORT_NAME:
            return "shortName";
        case CommonDataKinds.Nickname.TYPE_OTHER_NAME:
            return "otherName";
        default:
            return "unknown";
        }
    }

    @Override
    public void fromMap(Map<String, Object> readableMap) {
        super.fromMap(readableMap);
        // TODO: Evan: Decode contact data
    }
}
