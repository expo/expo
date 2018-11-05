package expo.modules.contacts.models;

import android.content.ContentValues;
import android.database.Cursor;
import android.provider.ContactsContract;

import static android.provider.ContactsContract.*;

public class ImAddressModel extends BaseModel {

    @Override
    public String getContentType() {
        return CommonDataKinds.Im.CONTENT_ITEM_TYPE;
    }

    @Override
    public String getDataAlias() {
        return "username";
    }

    private String serializeService(int protocol) {
        switch (protocol) {
        case CommonDataKinds.Im.PROTOCOL_AIM:
            return "aim";
        case CommonDataKinds.Im.PROTOCOL_GOOGLE_TALK:
            return "googleTalk";
        case CommonDataKinds.Im.PROTOCOL_ICQ:
            return "icq";
        case CommonDataKinds.Im.PROTOCOL_JABBER:
            return "jabber";
        case CommonDataKinds.Im.PROTOCOL_MSN:
            return "msn";
        case CommonDataKinds.Im.PROTOCOL_NETMEETING:
            return "netmeeting";
        case CommonDataKinds.Im.PROTOCOL_QQ:
            return "qq";
        case CommonDataKinds.Im.PROTOCOL_SKYPE:
            return "skype";
        case CommonDataKinds.Im.PROTOCOL_YAHOO:
            return "yahoo";
        case CommonDataKinds.Im.PROTOCOL_CUSTOM:
            return "custom";
        default:
            return "unknown";
        }
    }

    @Override
    public void fromCursor(Cursor cursor) {
        super.fromCursor(cursor);
        map.putString("service", serializeService(cursor.getInt(cursor.getColumnIndex(CommonDataKinds.Im.PROTOCOL))));
    }

    @Override
    public ContentValues getContentValues() {
        ContentValues values = super.getContentValues();
        values.put(CommonDataKinds.Im.PROTOCOL, getString("service"));
        return values;
    }
}
