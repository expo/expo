package expo.modules.sharing

import android.content.Context
import android.content.Intent
import android.net.Uri

internal class SimpleShareIntentDataParser {
  companion object {
    fun parse(context: Context, intent: Intent): List<SharePayload> {
      val type = intent.type ?: return emptyList()

      return when (intent.action) {
        Intent.ACTION_SEND -> handleSendAction(context, intent, type)
        Intent.ACTION_SEND_MULTIPLE -> handleSendMultipleAction(context, intent, type)
        else -> emptyList()
      }
    }

    private fun handleSendAction(context: Context, intent: Intent, type: String): List<SharePayload> {
      return if (type == "text/plain") {
        val text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return emptyList()
        val isUrl = android.util.Patterns.WEB_URL.matcher(text).matches()

        listOf(
          SharePayload().apply {
            value = text
            shareType = if (isUrl) ShareType.Url else ShareType.Text
            mimeType = "text/plain"
          }
        )
      } else {
        val uri = intent.getParcelableExtraCompat<Uri>(Intent.EXTRA_STREAM)
        listOfNotNull(uri?.let { createUriPayload(context, it, type) })
      }
    }

    private fun handleSendMultipleAction(context: Context, intent: Intent, type: String): List<SharePayload> {
      val uris = intent.getParcelableArrayListExtraCompat<Uri>(Intent.EXTRA_STREAM)
      return uris?.map { createUriPayload(context, it, type) } ?: emptyList()
    }

    private fun createUriPayload(context: Context, uri: Uri, defaultType: String): SharePayload {
      val specificType = context.contentResolver.getType(uri) ?: defaultType
      return SharePayload().apply {
        value = uri.toString()
        shareType = ShareType.fromMimeType(specificType)
        mimeType = specificType
      }
    }
  }
}
