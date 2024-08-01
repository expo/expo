package host.exp.exponent.utils

import android.content.ContentProviderOperation
import android.provider.ContactsContract
import android.content.Context
import android.net.Uri
import java.lang.Exception
import java.lang.RuntimeException
import java.util.ArrayList

object TestContacts {
  fun add(context: Context) {
    removeAllContacts(context)
    addContact(context, "JESSE", "TEST", "1234567890", "jessetest@testexpo.io")
    addContact(context, "BEN", "TEST", "1234567891", "bentest@testexpo.io")
    addContact(context, "JAMES", "TEST", "1234567892", "jamestest@testexpo.io")
    addContact(context, "BRENT", "TEST", "1234567894", "brenttest@testexpo.io")
  }

  private fun addContact(
    context: Context,
    firstName: String,
    lastName: String,
    phoneNumber: String,
    email: String
  ) {
    val operationList = ArrayList<ContentProviderOperation>()
    operationList.add(
      ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI)
        .withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null)
        .withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null)
        .build()
    )

    // first and last names
    operationList.add(
      ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
        .withValue(
          ContactsContract.Data.MIMETYPE,
          ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE
        )
        .withValue(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME, firstName)
        .withValue(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME, lastName)
        .build()
    )
    operationList.add(
      ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
        .withValue(
          ContactsContract.Data.MIMETYPE,
          ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE
        )
        .withValue(ContactsContract.CommonDataKinds.Phone.NUMBER, phoneNumber)
        .withValue(
          ContactsContract.CommonDataKinds.Phone.TYPE,
          ContactsContract.CommonDataKinds.Phone.TYPE_HOME
        )
        .build()
    )
    operationList.add(
      ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
        .withValue(
          ContactsContract.Data.MIMETYPE,
          ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE
        )
        .withValue(ContactsContract.CommonDataKinds.Email.DATA, email)
        .withValue(
          ContactsContract.CommonDataKinds.Email.TYPE,
          ContactsContract.CommonDataKinds.Email.TYPE_WORK
        )
        .build()
    )
    try {
      context.contentResolver.applyBatch(ContactsContract.AUTHORITY, operationList)
    } catch (e: Exception) {
      throw RuntimeException(e)
    }
  }

  private fun removeAllContacts(context: Context) {
    val cr = context.contentResolver
    val cursor = cr.query(ContactsContract.Contacts.CONTENT_URI, null, null, null, null) ?: return
    cursor.use {
      while (it.moveToNext()) {
        val id = it.getString(it.getColumnIndex(ContactsContract.Contacts._ID))
        val cur1 = cr.query(
          ContactsContract.CommonDataKinds.Email.CONTENT_URI,
          null,
          ContactsContract.CommonDataKinds.Email.CONTACT_ID + " = ?",
          arrayOf(id),
          null
        )
        var shouldDelete = false
        while (cur1!!.moveToNext()) {
          val email =
            cur1.getString(cur1.getColumnIndex(ContactsContract.CommonDataKinds.Email.DATA))
          if (email != null && email.endsWith("@testexpo.io")) {
            shouldDelete = true
            break
          }
        }
        cur1.close()
        if (shouldDelete) {
          val lookupKey = it.getString(it.getColumnIndex(ContactsContract.Contacts.LOOKUP_KEY))
          val uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_LOOKUP_URI, lookupKey)
          cr.delete(uri, null, null)
        }
      }
    }
  }
}
