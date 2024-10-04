package expo.modules.intentlauncher

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.core.os.bundleOf
import expo.modules.intentlauncher.exceptions.ActivityAlreadyStartedException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val REQUEST_CODE = 12
private const val ATTR_EXTRA = "extra"
private const val ATTR_DATA = "data"

class IntentLauncherModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoIntentLauncher")

    AsyncFunction("startActivity") { activityAction: String, params: IntentLauncherParams, promise: Promise ->
      if (pendingPromise != null) {
        throw ActivityAlreadyStartedException()
      }
      val intent = Intent(activityAction)

      params.className?.let {
        intent.component =
          if (params.packageName != null) {
            ComponentName(params.packageName, params.className)
          } else {
            ComponentName(context, params.className)
          }
      }

      // `setData` and `setType` are exclusive, so we need to use `setDateAndType` in that case.
      if (params.data != null && params.type != null) {
        intent.setDataAndType(Uri.parse(params.data), params.type)
      } else {
        intent.apply {
          if (params.data != null) {
            data = Uri.parse(params.data)
          } else if (params.type != null) {
            type = params.type
          }
        }
      }

      params.extra?.let { intent.putExtras(it.toBundle()) }
      params.flags?.let { intent.addFlags(it) }
      params.category?.let { intent.addCategory(it) }

      pendingPromise = promise
      currentActivity.startActivityForResult(intent, REQUEST_CODE)
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != REQUEST_CODE) {
        return@OnActivityResult
      }

      val response = Bundle().apply {
        putInt("resultCode", payload.resultCode)
        if (payload.data != null) {
          payload.data?.let { putString(ATTR_DATA, it.toString()) }
          payload.data?.extras?.let { putBundle(ATTR_EXTRA, it) }
        }
      }

      pendingPromise?.resolve(response)
      pendingPromise = null
    }
  }
}

private fun Map<String, Any>.toBundle(): Bundle = bundleOf(*this.toList().toTypedArray())
