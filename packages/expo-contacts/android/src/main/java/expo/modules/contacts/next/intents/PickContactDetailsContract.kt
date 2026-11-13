package expo.modules.contacts.next.intents

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

data class PickContactDetailsInput(val mimeTypes: ArrayList<String>) : Serializable

class PickContactDetailsContract : AppContextActivityResultContract<PickContactDetailsInput, Uri?> {
  override fun createIntent(context: Context, input: PickContactDetailsInput): Intent {
    val intent = Intent(ACTION_PICK_CONTACTS)
    intent.putStringArrayListExtra(EXTRA_REQUESTED_DATA_FIELDS, input.mimeTypes)
    return intent
  }

  override fun parseResult(input: PickContactDetailsInput, resultCode: Int, intent: Intent?): Uri? =
    if (resultCode == Activity.RESULT_OK) {
      intent?.data
    } else {
      null
    }

  companion object {
    private const val ACTION_PICK_CONTACTS = "android.provider.action.PICK_CONTACTS"
    private const val EXTRA_REQUESTED_DATA_FIELDS = "android.provider.extra.PICK_CONTACTS_REQUESTED_DATA_FIELDS"
  }
}
