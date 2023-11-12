package expo.modules.mailcomposer

import android.content.Intent
import android.content.pm.LabeledIntent
import android.net.Uri
import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.pm.ResolveInfo

class MailComposerModule : Module() {
  private val context get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val currentActivity get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private var composerOpened = false
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    // TODO: Rename the package to 'ExpoMail'
    Name("ExpoMailComposer")

    AsyncFunction("isAvailableAsync") {
      return@AsyncFunction true
    }

    AsyncFunction("openClientAsync") { options: MailClientOptions, promise: Promise ->
      val emailIntent = Intent(Intent.ACTION_VIEW, Uri.parse(MAILTO_URI))
      val pm = currentActivity.packageManager
      val resInfo = pm.queryIntentActivities(emailIntent, 0)
      if (resInfo.isNotEmpty()) {
        val intentChooser = createLaunchIntent(resInfo[0])
        intentChooser?.let {
          val openInChooser = Intent.createChooser(it, options.title)
          val extraIntents = resInfo.drop(1).mapNotNull { ri ->
            createLaunchIntent(ri)?.let { intent ->
              LabeledIntent(intent, ri.activityInfo.packageName, ri.loadLabel(pm), ri.icon)
            }
          }.toTypedArray()
          openInChooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, extraIntents)
          currentActivity.startActivity(openInChooser)
          // Ist das korrekt?
          promise.resolve(true)
        } ?: promise.reject(ERROR_UNABLE_TO_CREATE_INTENT, "Unable to create launch intent for email client", null)
      } else {
        promise.reject(ERROR_NO_EMAIL_APPS_AVAILABLE, "No email apps available", null)
      }
    }

    AsyncFunction("composeAsync") { options: MailComposerOptions, promise: Promise ->
      val intent = Intent(Intent.ACTION_SENDTO).apply { data = Uri.parse(MAILTO_URI) }
      val resolveInfo = context.packageManager.queryIntentActivities(intent, 0)
      if (resolveInfo.isNotEmpty()) {
        val mailIntents = resolveInfo.map { info ->
          val mailIntentBuilder = MailIntentBuilder(options)
            .setComponentName(info.activityInfo.packageName, info.activityInfo.name)
            .putRecipients(Intent.EXTRA_EMAIL)
            .putCcRecipients(Intent.EXTRA_CC)
            .putBccRecipients(Intent.EXTRA_BCC)
            .putSubject(Intent.EXTRA_SUBJECT)
            .putBody(Intent.EXTRA_TEXT, options.isHtml ?: false)
            .putAttachments(Intent.EXTRA_STREAM, currentActivity.application)
          LabeledIntent(mailIntentBuilder.build(), info.activityInfo.packageName, info.loadLabel(context.packageManager), info.icon)
        }.toMutableList()

        val chooser = Intent.createChooser(mailIntents.removeAt(mailIntents.size - 1), null).apply {
          putExtra(Intent.EXTRA_INITIAL_INTENTS, mailIntents.toTypedArray())
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        pendingPromise = promise
        currentActivity.startActivityForResult(chooser, REQUEST_CODE)
        composerOpened = true
      } else {
        promise.reject(ERROR_NO_EMAIL_APPS_AVAILABLE, "No email apps available for sending", null)
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode == REQUEST_CODE && composerOpened) {
        pendingPromise?.resolve(Bundle().apply { putString("status", "sent") })
        composerOpened = false
      }
    }
  }

  private fun createLaunchIntent(resolveInfo: ResolveInfo): Intent? =
    currentActivity.packageManager.getLaunchIntentForPackage(resolveInfo.activityInfo.packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

  companion object {
    private const val ERROR_UNABLE_TO_CREATE_INTENT = "E_UNABLE_TO_CREATE_INTENT"
    private const val ERROR_NO_EMAIL_APPS_AVAILABLE = "E_NO_EMAIL_APPS_AVAILABLE"
    private const val REQUEST_CODE = 8675
    private const val MAILTO_URI = "mailto:"
  }
}
