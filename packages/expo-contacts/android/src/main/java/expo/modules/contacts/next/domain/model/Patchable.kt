//package expo.modules.contacts.next.domain.model
//
//import android.content.ContentProviderOperation
//import android.content.ContentValues
//import android.provider.ContactsContract
//import expo.modules.contacts.next.domain.wrappers.DataId
//
//interface Patchable {
//  val dataId: DataId
//  val mimeType: String
//  val contentValues: ContentValues
//
//  fun toPatchOperation() =
//    with(ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)) {
//      withSelection(
//        "${DataId.COLUMN_IN_DATA_TABLE} = ? AND ${ContactsContract.Data.MIMETYPE} = ?",
//        arrayOf(dataId.value, mimeType)
//      )
//      withValues(contentValues)
//      build()
//    }
//}
