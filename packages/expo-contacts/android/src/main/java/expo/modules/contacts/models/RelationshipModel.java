package expo.modules.contacts.models;
import android.database.Cursor;
import android.provider.ContactsContract;

import expo.modules.contacts.EXColumns;

import static android.provider.ContactsContract.*;

public class RelationshipModel extends BaseModel {

    @Override
    public String getContentType() {
        return CommonDataKinds.Relation.CONTENT_ITEM_TYPE;
    }

    @Override
    public String getDataAlias() {
        return "name";
    }

    @Override
    protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null)
            return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
        case CommonDataKinds.Relation.TYPE_ASSISTANT:
            return "assistant";
        case CommonDataKinds.Relation.TYPE_BROTHER:
            return "bother";
        case CommonDataKinds.Relation.TYPE_CHILD:
            return "child";
        case CommonDataKinds.Relation.TYPE_DOMESTIC_PARTNER:
            return "domesticPartner";
        case CommonDataKinds.Relation.TYPE_FATHER:
            return "father";
        case CommonDataKinds.Relation.TYPE_FRIEND:
            return "friend";
        case CommonDataKinds.Relation.TYPE_MANAGER:
            return "manager";
        case CommonDataKinds.Relation.TYPE_MOTHER:
            return "mother";
        case CommonDataKinds.Relation.TYPE_PARENT:
            return "parent";
        case CommonDataKinds.Relation.TYPE_PARTNER:
            return "partner";
        case CommonDataKinds.Relation.TYPE_REFERRED_BY:
            return "referredBy";
        case CommonDataKinds.Relation.TYPE_RELATIVE:
            return "relative";
        case CommonDataKinds.Relation.TYPE_SISTER:
            return "sister";
        case CommonDataKinds.Relation.TYPE_SPOUSE:
            return "spouse";
        default:
            return "unknown";
        }
    }

}