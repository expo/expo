package expo.modules.camera.documentscanner

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentSender
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult.Companion.ACTION_INTENT_SENDER_REQUEST
import androidx.activity.result.contract.ActivityResultContracts.StartIntentSenderForResult.Companion.EXTRA_INTENT_SENDER_REQUEST
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import java.io.Serializable

class DocumentScannerContractInput : Serializable

class DocumentScannerActivityResult(
  val cancelled: Boolean,
  val result: GmsDocumentScanningResult?
)

class DocumentScannerContract(
  private val intentSenderProvider: () -> IntentSender?
) : AppContextActivityResultContract<DocumentScannerContractInput, DocumentScannerActivityResult> {

  override fun createIntent(context: Context, input: DocumentScannerContractInput): Intent {
    val intentSender = intentSenderProvider()
      ?: throw IllegalStateException("Document scanner IntentSender was not prepared before launch")
    val request = IntentSenderRequest.Builder(intentSender).build()
    return Intent(ACTION_INTENT_SENDER_REQUEST).putExtra(EXTRA_INTENT_SENDER_REQUEST, request)
  }

  override fun parseResult(
    input: DocumentScannerContractInput,
    resultCode: Int,
    intent: Intent?
  ): DocumentScannerActivityResult {
    if (resultCode != Activity.RESULT_OK) {
      return DocumentScannerActivityResult(cancelled = true, result = null)
    }
    return DocumentScannerActivityResult(
      cancelled = false,
      result = GmsDocumentScanningResult.fromActivityResultIntent(intent)
    )
  }
}
