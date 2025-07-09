package expo.modules.intentlauncher

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.AdaptiveIconDrawable
import android.graphics.drawable.BitmapDrawable
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import androidx.core.os.bundleOf
import expo.modules.intentlauncher.exceptions.ActivityAlreadyStartedException
import expo.modules.intentlauncher.exceptions.PackageNotFoundException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

private const val REQUEST_CODE = 12
private const val ATTR_EXTRA = "extra"
private const val ATTR_DATA = "data"

class IntentLauncherModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
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

      // `setData` and `setType` are exclusive, so we need to use `setDataAndType` in that case.
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

      params.extra?.let {
        val valuesList = it.mapValues { (_, value) ->
          if (value is Double) value.toInt() else value
        }
        intent.putExtras(valuesList.toBundle())
      }
      params.flags?.let { intent.addFlags(it) }
      params.category?.let { intent.addCategory(it) }

      try {
        appContext.throwingActivity.startActivityForResult(intent, REQUEST_CODE)
        pendingPromise = promise
      } catch (e: Throwable) {
        promise.reject(e.toCodedException())
      }
    }

    Function("openApplication") { packageName: String ->
      val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
        ?: throw PackageNotFoundException(packageName)
      appContext.throwingActivity.startActivity(launchIntent)
    }

    AsyncFunction("getApplicationIcon") { packageName: String ->
      val pm = context.packageManager
      val appInfo = try {
        pm.getApplicationInfo(packageName, 0)
      } catch (e: PackageManager.NameNotFoundException) {
        throw PackageNotFoundException(packageName)
      }

      // Get the app icon as a base64-encoded string
      val iconDrawable = pm.getApplicationIcon(appInfo)
      val bitmap = when (iconDrawable) {
        is BitmapDrawable -> iconDrawable.bitmap
        is AdaptiveIconDrawable -> {
          // Create a bitmap from AdaptiveIconDrawable
          val bitmap = Bitmap.createBitmap(
            iconDrawable.intrinsicWidth,
            iconDrawable.intrinsicHeight,
            Bitmap.Config.ARGB_8888
          )
          val canvas = Canvas(bitmap)
          iconDrawable.setBounds(0, 0, canvas.width, canvas.height)
          iconDrawable.draw(canvas)
          bitmap
        }
        else -> null
      }

      bitmap?.let {
        val outputStream = ByteArrayOutputStream()
        it.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        val iconBytes = outputStream.toByteArray()
        "data:image/png;base64," + Base64.encodeToString(iconBytes, Base64.NO_WRAP)
      } ?: ""
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
