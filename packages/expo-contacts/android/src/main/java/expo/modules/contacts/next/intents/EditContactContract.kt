package expo.modules.contacts.next.intents

import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

data class EditContactInput(val lookupKeyUri: Uri) : Serializable

class EditContactContract : AppContextActivityResultContract<EditContactInput, Boolean> {
  override fun createIntent(context: Context, input: EditContactInput): Intent {
    return Intent(Intent.ACTION_EDIT, input.lookupKeyUri)
  }

  override fun parseResult(input: EditContactInput, resultCode: Int, intent: Intent?): Boolean {
    return resultCode == android.app.Activity.RESULT_OK
  }
}
