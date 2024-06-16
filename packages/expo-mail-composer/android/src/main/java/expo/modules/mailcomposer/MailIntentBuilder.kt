package expo.modules.mailcomposer

import android.app.Application
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.text.Html
import android.util.Log
import androidx.core.content.FileProvider
import java.io.File

class MailIntentBuilder(
  private val options: MailComposerOptions
) {
  private val mailIntent = Intent(Intent.ACTION_SEND_MULTIPLE)

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

  fun putRecipients(intentName: String) = apply {
    options.recipients?.let {
      mailIntent.putExtra(intentName, it.toTypedArray())
    }
  }

  fun putCcRecipients(intentName: String) = apply {
    options.ccRecipients?.let {
      mailIntent.putExtra(intentName, it.toTypedArray())
    }
  }

  fun putBccRecipients(intentName: String) = apply {
    options.bccRecipients?.let {
      mailIntent.putExtra(intentName, it.toTypedArray())
    }
  }

  fun putSubject(intentName: String) = apply {
    options.subject?.let {
      mailIntent.putExtra(intentName, it)
    }
  }

  fun putBody(intentName: String, isBodyHtml: Boolean) = apply {
    options.body?.let {
      val body = if (isBodyHtml) {
        Html.fromHtml(options.body)
      } else {
        options.body
      }
      mailIntent.putExtra(intentName, body)
    }
  }

  fun putAttachments(
    intentName: String,
    application: Application
  ) = apply {
    try {
      options.attachments?.let { requestedAttachments ->
        val attachments = requestedAttachments.toTypedArray().map { requestedAttachment ->
          val path = Uri.parse(requestedAttachment).path
          requireNotNull(path) { "Path to attachment can not be null" }

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
