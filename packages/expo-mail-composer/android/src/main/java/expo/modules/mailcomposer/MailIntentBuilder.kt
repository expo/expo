package expo.modules.mailcomposer

import android.app.Application
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.text.Html
import android.util.Log
import androidx.core.content.FileProvider
import expo.modules.core.arguments.ReadableArguments
import java.io.File

class MailIntentBuilder(
  private val options: ReadableArguments
) {
  private val mailIntent = Intent(Intent.ACTION_SEND_MULTIPLE)

  @Suppress("UNCHECKED_CAST")
  private fun getStringArrayFrom(key: String): Array<String?> {
    return (options.getList(key) as List<String?>).toTypedArray()
  }

  private fun contentUriFromFile(file: File, application: Application): Uri = try {
    FileProvider.getUriForFile(
      application,
      application.packageName + ".MailComposerFileProvider",
      file
    )
  } catch (e: Exception) {
    Uri.fromFile(file)
  }

  fun build() = mailIntent

  fun setComponentName(pkg: String, cls: String) = apply {
    mailIntent.component = ComponentName(pkg, cls)
  }

  fun putExtraIfKeyExists(key: String, intentName: String) = apply {
    if (options.containsKey(key)) {
      if (options.getList(key) != null) {
        mailIntent.putExtra(intentName, getStringArrayFrom(key))
      } else {
        mailIntent.putExtra(intentName, options.getString(key))
      }
    }
  }

  fun putExtraIfKeyExists(key: String, intentName: String, isBodyHtml: Boolean) = apply {
    if (options.containsKey(key)) {
      val body = if (isBodyHtml) {
        Html.fromHtml(options.getString(key))
      } else {
        options.getString(key)
      }
      mailIntent.putExtra(intentName, body)
    }
  }

  fun putParcelableArrayListExtraIfKeyExists(
    key: String,
    intentName: String,
    application: Application,
  ) = apply {
    try {
      if (options.containsKey(key)) {
        val requestedAttachments = getStringArrayFrom(key)
        val attachments = requestedAttachments.map { requestedAttachment ->
          val path = Uri.parse(requestedAttachment).path
          requireNotNull(path, { "Path to attachment can not be null" })
          val attachmentFile = File(path)
          contentUriFromFile(attachmentFile, application)
        }.toCollection(ArrayList())
        mailIntent.putParcelableArrayListExtra(intentName, attachments)
      }
    } catch (error: IllegalArgumentException) {
      Log.e("ExpoMailComposer", "Illegal argument:", error)
    }
  }
}
