package expo.modules.contacts.models;
import android.database.Cursor;
import android.provider.ContactsContract;

import expo.modules.contacts.EXColumns;

import static android.provider.ContactsContract.*;

public class UrlAddressModel extends BaseModel {
    @Override
    public String getContentType() {
        return CommonDataKinds.Website.CONTENT_ITEM_TYPE;
    }

    @Override
    public String getDataAlias() {
        return "url";
    }

    @Override
    protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null)
            return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
        case CommonDataKinds.Website.TYPE_HOME:
            return "home";
        case CommonDataKinds.Website.TYPE_WORK:
            return "work";
        case CommonDataKinds.Website.TYPE_BLOG:
            return "blog";
        case CommonDataKinds.Website.TYPE_FTP:
            return "ftp";
        case CommonDataKinds.Website.TYPE_HOMEPAGE:
            return "homepage";
        case CommonDataKinds.Website.TYPE_PROFILE:
            return "profile";
        case CommonDataKinds.Website.TYPE_OTHER:
            return "other";
        default:
            return "unknown";
        }
    }

}