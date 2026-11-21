package expo.modules.contacts.next.intents

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

data class PickContactDataInput(val contentUri: String) : Serializable

class PickContactDataContract : AppContextActivityResultContract<PickContactDataInput, Uri?> {
  override fun createIntent(context: Context, input: PickContactDataInput): Intent =
    Intent(Intent.ACTION_PICK, Uri.parse(input.contentUri))

  override fun parseResult(input: PickContactDataInput, resultCode: Int, intent: Intent?): Uri? =
    if (resultCode == Activity.RESULT_OK) {
      intent?.data
    } else {
      null
    }
}
