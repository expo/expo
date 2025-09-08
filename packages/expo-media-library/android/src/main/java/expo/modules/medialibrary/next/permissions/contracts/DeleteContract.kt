package expo.modules.medialibrary.next.permissions.contracts

import android.app.Activity
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult.Companion.ACTION_INTENT_SENDER_REQUEST
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult.Companion.EXTRA_INTENT_SENDER_REQUEST
import androidx.annotation.RequiresApi
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.providers.AppContextProvider
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import java.io.Serializable

class DeleteContract(
  private val appContextProvider: AppContextProvider
) : AppContextActivityResultContract<DeleteContractInput, Boolean> {
  private val contentResolver: ContentResolver
    get() = appContextProvider.appContext.reactContext?.contentResolver
      ?: throw ContentResolverNotObtainedException()

  @RequiresApi(Build.VERSION_CODES.R)
  override fun createIntent(context: Context, input: DeleteContractInput): Intent {
    val request = MediaStore.createDeleteRequest(contentResolver, input.uris)
    val intentSenderRequest = IntentSenderRequest.Builder(request.intentSender).build()
    return Intent(ACTION_INTENT_SENDER_REQUEST).putExtra(EXTRA_INTENT_SENDER_REQUEST, intentSenderRequest)
  }

  override fun parseResult(input: DeleteContractInput, resultCode: Int, intent: Intent?): Boolean {
    return resultCode == Activity.RESULT_OK
  }
}

data class DeleteContractInput(val uris: List<Uri>) : Serializable
