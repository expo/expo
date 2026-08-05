package expo.modules.contacts.next.intents

import android.content.Context
import android.content.Intent
import android.provider.ContactsContract
import android.net.Uri
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

class PickContactInput : Serializable

class PickContactContract : AppContextActivityResultContract<PickContactInput, Uri?> {
  override fun createIntent(context: Context, input: PickContactInput): Intent =
    Intent(Intent.ACTION_PICK, ContactsContract.Contacts.CONTENT_URI)

  override fun parseResult(input: PickContactInput, resultCode: Int, intent: Intent?): Uri? =
    if (resultCode == android.app.Activity.RESULT_OK) {
      intent?.data
    } else {
      null
    }
}
