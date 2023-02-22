package expo.modules.mailcomposer

import android.content.Intent
import android.content.pm.LabeledIntent
import android.net.Uri
import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MailComposerModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private var composerOpened = false
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoMailComposer")

    AsyncFunction("isAvailableAsync") {
      return@AsyncFunction true
    }

    AsyncFunction("composeAsync") { options: MailComposerOptions, promise: Promise ->
      val intent = Intent(Intent.ACTION_SENDTO).apply { data = Uri.parse("mailto:") }
      val application = currentActivity.application
      val resolveInfo = context.packageManager.queryIntentActivities(intent, 0)

      val mailIntents = resolveInfo.map { info ->
        val mailIntentBuilder = MailIntentBuilder(options)
          .setComponentName(info.activityInfo.packageName, info.activityInfo.name)
          .putRecipients(Intent.EXTRA_EMAIL)
          .putCcRecipients(Intent.EXTRA_CC)
          .putBccRecipients(Intent.EXTRA_BCC)
          .putSubject(Intent.EXTRA_SUBJECT)
          .putBody(Intent.EXTRA_TEXT, options.isHtml ?: false)
          .putAttachments(
            Intent.EXTRA_STREAM,
            application
          )

        LabeledIntent(
          mailIntentBuilder.build(),
          info.activityInfo.packageName,
          info.loadLabel(context.packageManager),
          info.icon
        )
      }.toMutableList()

      val chooser = Intent.createChooser(
        mailIntents.removeAt(mailIntents.size - 1),
        null
      ).apply {
        putExtra(Intent.EXTRA_INITIAL_INTENTS, mailIntents.toTypedArray())
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }

      pendingPromise = promise
      currentActivity.startActivityForResult(chooser, REQUEST_CODE)
      composerOpened = true
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode == REQUEST_CODE && pendingPromise != null) {
        val promise = pendingPromise ?: return@OnActivityResult
        if (composerOpened) {
          composerOpened = false
          promise.resolve(Bundle().apply { putString("status", "sent") })
        }
      }
    }
  }

  companion object {
    private const val REQUEST_CODE = 8675
  }
}
