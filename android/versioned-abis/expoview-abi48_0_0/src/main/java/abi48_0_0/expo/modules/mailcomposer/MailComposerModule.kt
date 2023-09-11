package abi48_0_0.expo.modules.mailcomposer

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.LabeledIntent
import android.net.Uri
import android.os.Bundle
import abi48_0_0.expo.modules.core.ExportedModule
import abi48_0_0.expo.modules.core.ModuleRegistry
import abi48_0_0.expo.modules.core.ModuleRegistryDelegate
import abi48_0_0.expo.modules.core.Promise
import abi48_0_0.expo.modules.core.arguments.ReadableArguments
import abi48_0_0.expo.modules.core.interfaces.ActivityProvider
import abi48_0_0.expo.modules.core.interfaces.ExpoMethod
import abi48_0_0.expo.modules.core.interfaces.ActivityEventListener
import abi48_0_0.expo.modules.core.interfaces.services.UIManager

class MailComposerModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), ActivityEventListener {
  private var composerOpened = false
  private val uiManager: UIManager by moduleRegistry()
  private var pendingPromise: Promise? = null
  override fun getName() = "ExpoMailComposer"
  private val activityProvider: ActivityProvider by moduleRegistry()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
    uiManager.registerActivityEventListener(this)
  }

  override fun onDestroy() {
    uiManager.unregisterActivityEventListener(this)
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
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    pendingPromise = promise
    activityProvider.currentActivity.startActivityForResult(chooser, REQUEST_CODE)
    composerOpened = true
  }

  override fun onNewIntent(intent: Intent) = Unit

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == REQUEST_CODE && pendingPromise != null) {
      val promise = pendingPromise ?: return
      if (composerOpened) {
        composerOpened = false
        promise.resolve(Bundle().apply { putString("status", "sent") })
      }
    }
  }

  companion object {
    private const val REQUEST_CODE = 8675
  }
}
