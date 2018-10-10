package expo.modules.contacts.models;

import android.database.Cursor;
import android.provider.ContactsContract;

import java.util.Map;

import expo.modules.contacts.EXColumns;

import static android.provider.ContactsContract.*;

public class PhoneNumberModel extends BaseModel {
    @Override
    public String getContentType() {
        return CommonDataKinds.Phone.CONTENT_ITEM_TYPE;
    }

    @Override
    public String getDataAlias() {
        return "number";
    }

    @Override
    public void fromMap(Map<String, Object> readableMap) {
        super.fromMap(readableMap);

        String phoneNumber = getData();
        map.putString("digits", phoneNumber.replaceAll("[^\\d.]", ""));
    }

    @Override
    public int mapStringToType(String label) {
        int phoneType;
        switch (label) {
        case "home":
            phoneType = CommonDataKinds.Phone.TYPE_HOME;
            break;
        case "mobile":
            phoneType = CommonDataKinds.Phone.TYPE_MOBILE;
            break;
        case "work":
            phoneType = CommonDataKinds.Phone.TYPE_WORK;
            break;
        case "faxWork":
            phoneType = CommonDataKinds.Phone.TYPE_FAX_WORK;
            break;
        case "faxHome":
            phoneType = CommonDataKinds.Phone.TYPE_FAX_HOME;
            break;
        case "pager":
            phoneType = CommonDataKinds.Phone.TYPE_PAGER;
            break;
        case "callback":
            phoneType = CommonDataKinds.Phone.TYPE_CALLBACK;
            break;
        case "car":
            phoneType = CommonDataKinds.Phone.TYPE_CAR;
            break;
        case "companyMain":
            phoneType = CommonDataKinds.Phone.TYPE_COMPANY_MAIN;
            break;
        case "isdn":
            phoneType = CommonDataKinds.Phone.TYPE_ISDN;
            break;
        case "main":
            phoneType = CommonDataKinds.Phone.TYPE_MAIN;
            break;
        case "otherFax":
            phoneType = CommonDataKinds.Phone.TYPE_OTHER_FAX;
            break;
        case "radio":
            phoneType = CommonDataKinds.Phone.TYPE_RADIO;
            break;
        case "telex":
            phoneType = CommonDataKinds.Phone.TYPE_TELEX;
            break;
        case "ttyTdd":
            phoneType = CommonDataKinds.Phone.TYPE_TTY_TDD;
            break;
        case "workMobile":
            phoneType = CommonDataKinds.Phone.TYPE_WORK_MOBILE;
            break;
        case "workPager":
            phoneType = CommonDataKinds.Phone.TYPE_WORK_PAGER;
            break;
        case "assistant":
            phoneType = CommonDataKinds.Phone.TYPE_ASSISTANT;
            break;
        case "mms":
            phoneType = CommonDataKinds.Phone.TYPE_MMS;
            break;
        case "other":
            phoneType = CommonDataKinds.Phone.TYPE_OTHER;
            break;
        default:
            phoneType = EXColumns.TYPE_CUSTOM;

            break;
        }
        return phoneType;
    }

    @Override
    protected String getLabelFromCursor(Cursor cursor) {
        String label = super.getLabelFromCursor(cursor);
        if (label != null)
            return label;
        switch (cursor.getInt(cursor.getColumnIndex(EXColumns.TYPE))) {
        case CommonDataKinds.Phone.TYPE_HOME:
            return "home";
        case CommonDataKinds.Phone.TYPE_WORK:
            return "work";
        case CommonDataKinds.Phone.TYPE_MOBILE:
            return "mobile";
        case CommonDataKinds.Phone.TYPE_OTHER:
            return "other";
        default:
            return "unknown";
        }
    }

}
