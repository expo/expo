package expo.modules.contacts.next.intents

import android.app.Activity
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.provider.ContactsContract
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

data class AddContactInput(
  val contactValues: ArrayList<ContentValues>
) : Serializable

class AddContactContract : AppContextActivityResultContract<AddContactInput, Boolean> {
  override fun createIntent(context: Context, input: AddContactInput): Intent {
    val intent = Intent(Intent.ACTION_INSERT)
    intent.type = ContactsContract.Contacts.CONTENT_TYPE
    intent.putParcelableArrayListExtra(ContactsContract.Intents.Insert.DATA, input.contactValues)
    return intent
  }

  override fun parseResult(input: AddContactInput, resultCode: Int, intent: Intent?): Boolean {
    return resultCode == Activity.RESULT_OK
  }
}
