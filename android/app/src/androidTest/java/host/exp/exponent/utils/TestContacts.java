package host.exp.exponent.utils;

import android.content.ContentProviderOperation;
import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import android.util.Log;

import java.util.ArrayList;

public class TestContacts {

  public static void add(Context context) {
    removeAllContacts(context);
    addContact(context, "JESSE", "TEST", "1234567890", "jessetest@testexpo.io");
    addContact(context, "BEN", "TEST", "1234567891", "bentest@testexpo.io");
    addContact(context, "JAMES", "TEST", "1234567892", "jamestest@testexpo.io");
    addContact(context, "BRENT", "TEST", "1234567894", "brenttest@testexpo.io");
  }

  private static void addContact(final Context context, final String firstName, final String lastName, final String phoneNumnber, final String email) {
    ArrayList<ContentProviderOperation> operationList = new ArrayList<>();
    operationList.add(ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI)
        .withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null)
        .withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null)
        .build());

    // first and last names
    operationList.add(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
        .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE)
        .withValue(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME, firstName)
        .withValue(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME, lastName)
        .build());

    operationList.add(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
        .withValue(ContactsContract.Data.MIMETYPE,ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE)
        .withValue(ContactsContract.CommonDataKinds.Phone.NUMBER, phoneNumnber)
        .withValue(ContactsContract.CommonDataKinds.Phone.TYPE, ContactsContract.CommonDataKinds.Phone.TYPE_HOME)
        .build());
    operationList.add(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)

        .withValue(ContactsContract.Data.MIMETYPE,ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE)
        .withValue(ContactsContract.CommonDataKinds.Email.DATA, email)
        .withValue(ContactsContract.CommonDataKinds.Email.TYPE, ContactsContract.CommonDataKinds.Email.TYPE_WORK)
        .build());

    try {
      context.getContentResolver().applyBatch(ContactsContract.AUTHORITY, operationList);
    } catch(Exception e){
      throw new RuntimeException(e);
    }
  }

  private static void removeAllContacts(Context context) {
    ContentResolver cr = context.getContentResolver();
    Cursor cur = cr.query(ContactsContract.Contacts.CONTENT_URI, null, null, null, null);
    if (cur == null) {
      return;
    }
    try {
      while (cur.moveToNext()) {
        String id = cur.getString(cur.getColumnIndex(ContactsContract.Contacts._ID));
        Cursor cur1 = cr.query(ContactsContract.CommonDataKinds.Email.CONTENT_URI, null,
            ContactsContract.CommonDataKinds.Email.CONTACT_ID + " = ?",
            new String[]{id}, null);

        boolean shouldDelete = false;
        while (cur1.moveToNext()) {
          String email = cur1.getString(cur1.getColumnIndex(ContactsContract.CommonDataKinds.Email.DATA));
          if (email != null && email.endsWith("@testexpo.io")) {
            shouldDelete = true;
            break;
          }
        }
        cur1.close();

        if (shouldDelete) {
          String lookupKey = cur.getString(cur.getColumnIndex(ContactsContract.Contacts.LOOKUP_KEY));
          Uri uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_LOOKUP_URI, lookupKey);
          cr.delete(uri, null, null);
        }
      }
    } finally {
      cur.close();
    }
  }
}
