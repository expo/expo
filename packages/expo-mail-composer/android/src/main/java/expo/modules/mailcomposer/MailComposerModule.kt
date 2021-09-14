package expo.modules.mailcomposer

import android.content.Context
import android.content.Intent
import android.content.pm.LabeledIntent
import android.net.Uri
import android.os.Bundle
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.LifecycleEventListener

class MailComposerModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), LifecycleEventListener {
  private var composerOpened = false
  private var pendingPromise: Promise? = null
  override fun getName() = "ExpoMailComposer"
  private val activityProvider: ActivityProvider by moduleRegistry()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @ExpoMethod
  fun isAvailableAsync(promise: Promise) {
    promise.resolve(true)
  }

  @ExpoMethod
  fun composeAsync(options: ReadableArguments, promise: Promise) {
    val intent = Intent(Intent.ACTION_SENDTO).apply { data = Uri.parse("mailto:") }
    val application = activityProvider.currentActivity.application
    val resolveInfo = context.packageManager.queryIntentActivities(intent, 0)
    val mailIntents = resolveInfo.map { info ->
      val isHtml = options.containsKey("isHtml") && options.getBoolean("isHtml")
      val mailIntentBuilder = MailIntentBuilder(options)
        .setComponentName(info.activityInfo.packageName, info.activityInfo.name)
        .putExtraIfKeyExists("recipients", Intent.EXTRA_EMAIL)
        .putExtraIfKeyExists("ccRecipients", Intent.EXTRA_CC)
        .putExtraIfKeyExists("bccRecipients", Intent.EXTRA_BCC)
        .putExtraIfKeyExists("subject", Intent.EXTRA_SUBJECT)
        .putExtraIfKeyExists("body", Intent.EXTRA_TEXT, isHtml)
        .putParcelableArrayListExtraIfKeyExists(
          "attachments",
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
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    pendingPromise = promise
    context.startActivity(chooser)
    composerOpened = true
  }

  override fun onHostResume() {
    val promise = pendingPromise ?: return
    if (composerOpened) {
      composerOpened = false
      promise.resolve(Bundle().apply { putString("status", "sent") })
    }
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    // do nothing
  }
}
