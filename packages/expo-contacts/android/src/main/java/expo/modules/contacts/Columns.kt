package expo.modules.contacts

import android.provider.ContactsContract

object Columns {
  const val DATA_10 = "data10"
  const val DATA_9 = "data9"
  const val DATA_8 = "data8"
  const val DATA_7 = "data7"
  const val DATA_6 = "data6"
  const val DATA_5 = "data5"
  const val DATA_4 = "data4"
  const val LABEL = "data3"
  const val TYPE = "data2"
  const val DATA = "data1"
  const val ID = ContactsContract.Data._ID
  const val IS_PRIMARY = ContactsContract.Data.IS_PRIMARY
  const val CONTACT_ID = ContactsContract.Data.CONTACT_ID
  const val LOOKUP_KEY = ContactsContract.Data.LOOKUP_KEY
  const val DISPLAY_NAME = ContactsContract.Data.DISPLAY_NAME
  const val PHOTO_URI = ContactsContract.CommonDataKinds.Contactables.PHOTO_URI
  const val PHOTO_THUMBNAIL_URI = ContactsContract.CommonDataKinds.Contactables.PHOTO_THUMBNAIL_URI
  const val IS_USER_PROFILE = ContactsContract.CommonDataKinds.Contactables.IS_USER_PROFILE
  const val MIMETYPE = ContactsContract.Data.MIMETYPE
  const val TYPE_CUSTOM = 0
  const val STARRED = ContactsContract.Data.STARRED
}
