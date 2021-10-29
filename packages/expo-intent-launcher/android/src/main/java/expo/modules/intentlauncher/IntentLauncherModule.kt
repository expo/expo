package expo.modules.intentlauncher

import expo.modules.core.Promise
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.intentlauncher.exceptions.ActivityAlreadyStartedException

import android.net.Uri
import android.os.Bundle
import android.app.Activity
import android.content.Intent
import android.content.ComponentName
import android.content.ActivityNotFoundException
import android.content.Context

private const val NAME = "ExpoIntentLauncher"

private const val REQUEST_CODE = 12
private const val ATTR_ACTION = "action"
private const val ATTR_TYPE = "type"
private const val ATTR_CATEGORY = "category"
private const val ATTR_EXTRA = "extra"
private const val ATTR_DATA = "data"
private const val ATTR_FLAGS = "flags"
private const val ATTR_PACKAGE_NAME = "packageName"
private const val ATTR_CLASS_NAME = "className"

class IntentLauncherModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context), ActivityEventListener {
  private var pendingPromise: Promise? = null
  private val uiManager: UIManager by moduleRegistry()
  private val activityProvider: ActivityProvider by moduleRegistry()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun getName() = NAME

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @ExpoMethod
  fun startActivity(activityAction: String, params: ReadableArguments, promise: Promise) {
    if (pendingPromise != null) {
      promise.reject(ActivityAlreadyStartedException())
      return
    }

    val activity = activityProvider.currentActivity
    if (activity == null) {
      promise.reject(CurrentActivityNotFoundException())
      return
    }

    val intent = Intent(activityAction)

    if (params.containsKey(ATTR_CLASS_NAME)) {
      intent.component =
        if (params.containsKey(ATTR_PACKAGE_NAME)) ComponentName(params.getString(ATTR_PACKAGE_NAME), params.getString(ATTR_CLASS_NAME))
        else ComponentName(context, params.getString(ATTR_CLASS_NAME))
    }

    // `setData` and `setType` are exclusive, so we need to use `setDateAndType` in that case.
    if (params.containsKey(ATTR_DATA) && params.containsKey(ATTR_TYPE)) {
      intent.setDataAndType(Uri.parse(params.getString(ATTR_DATA)), params.getString(ATTR_TYPE))
    } else {
      if (params.containsKey(ATTR_DATA)) {
        intent.data = Uri.parse(params.getString(ATTR_DATA))
      } else if (params.containsKey(ATTR_TYPE)) {
        intent.type = params.getString(ATTR_TYPE)
      }
    }

    params.getArguments(ATTR_EXTRA)?.let { intent.putExtras(it.toBundle()) }
    params.getInt(ATTR_FLAGS)?.let { intent.addFlags(it) }
    params.getString(ATTR_CATEGORY)?.let { intent.addCategory(it) }

    uiManager.registerActivityEventListener(this)
    pendingPromise = promise

    try {
      activity.startActivityForResult(intent, REQUEST_CODE)
    } catch (e: ActivityNotFoundException) {
      promise.reject(e)
      pendingPromise = null
    }
  }

  //region ActivityEventListener

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?) {
    if (requestCode != REQUEST_CODE) return

    val response = Bundle().apply {
      putInt("resultCode", resultCode)
      if (intent != null) {
        intent.data?.let { putString(ATTR_DATA, it.toString()) }
        intent.extras?.let { putBundle(ATTR_EXTRA, it) }
      }
    }

    pendingPromise?.resolve(response)
    pendingPromise = null

    uiManager.unregisterActivityEventListener(this)
  }

  override fun onNewIntent(intent: Intent) = Unit

  //endregion
}
