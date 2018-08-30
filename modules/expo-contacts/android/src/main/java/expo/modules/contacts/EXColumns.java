package expo.modules.contacts;

import android.provider.ContactsContract;

public interface EXColumns {
  String DATA_10 = "data10";
  String DATA_9 = "data9";
  String DATA_8 = "data8";
  String DATA_7 = "data7";
  String DATA_6 = "data6";
  String DATA_5 = "data5";
  String DATA_4 = "data4";

  String LABEL = "data3";
  String TYPE = "data2";
  String DATA = "data1";
  String ID = ContactsContract.Data._ID;
  String IS_PRIMARY = ContactsContract.Data.IS_PRIMARY;
  String CONTACT_ID = ContactsContract.Data.CONTACT_ID;
  String LOOKUP_KEY = ContactsContract.Data.LOOKUP_KEY;
  String DISPLAY_NAME = ContactsContract.Data.DISPLAY_NAME;
  String PHOTO_URI = ContactsContract.CommonDataKinds.Contactables.PHOTO_URI;
  String PHOTO_THUMBNAIL_URI = ContactsContract.CommonDataKinds.Contactables.PHOTO_THUMBNAIL_URI;
  String IS_USER_PROFILE = ContactsContract.CommonDataKinds.Contactables.IS_USER_PROFILE;
  String MIMETYPE = ContactsContract.Data.MIMETYPE;
  int TYPE_CUSTOM = 0;
}