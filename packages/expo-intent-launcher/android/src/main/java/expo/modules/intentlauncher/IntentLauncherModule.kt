package expo.modules.intentlauncher

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.AdaptiveIconDrawable
import android.graphics.drawable.BitmapDrawable
import android.os.Build
import android.os.Bundle
import android.util.Base64
import androidx.core.graphics.createBitmap
import androidx.core.net.toUri
import androidx.core.os.bundleOf
import com.facebook.react.bridge.ActivityEventListener
import expo.modules.intentlauncher.exceptions.ActivityAlreadyStartedException
import expo.modules.intentlauncher.exceptions.PackageNotFoundException
import expo.modules.kotlin.exception.Exceptions
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import io.github.expo.modules.v2.react.reactContext
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.util.concurrent.atomic.AtomicReference

private const val REQUEST_CODE = 12

@ExpoModule("ExpoIntentLauncher")
class IntentLauncherModule : Module() {
  private val pendingResult = AtomicReference<CancellableContinuation<IntentLauncherResult>?>(null)

  private val activityEventListener = object : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CODE) {
        return
      }

      val continuation = pendingResult.getAndSet(null) ?: return
      continuation.resumeWith(
        runCatching {
          IntentLauncherResult(
            resultCode = resultCode,
            data = data?.toString(),
            extra = data?.extras?.toMap()
          )
        }
      )
    }

    override fun onNewIntent(intent: Intent) = Unit
  }

  override fun onDestroy() {
    reactContextOrNull?.removeActivityEventListener(activityEventListener)
  }

  @JS
  suspend fun startActivity(activityAction: String, params: IntentLauncherParams): IntentLauncherResult {
    val intent = Intent(activityAction)

    params.className?.let {
      intent.component =
        if (params.packageName != null) {
          ComponentName(params.packageName, params.className)
        } else {
          ComponentName(androidContext, params.className)
        }
    }

    // `setData` and `setType` are exclusive, so we need to use `setDataAndType` in that case.
    if (params.data != null && params.type != null) {
      intent.setDataAndType(params.data.toUri(), params.type)
    } else {
      intent.apply {
        if (params.data != null) {
          data = params.data.toUri()
        } else if (params.type != null) {
          type = params.type
        }
      }
    }

    params.extra?.let {
      val valuesList = it.mapValues { (_, value) ->
        when {
          value is Double -> {
            // JavaScript sends all numbers as doubles. We need to convert them appropriately:
            // - Large values (like calendar timestamps) need to be Long
            // - Smaller values should remain Int for backward compatibility
            if (value > Int.MAX_VALUE || value < Int.MIN_VALUE) {
              value.toLong()
            } else {
              value.toInt()
            }
          }

          else -> value
        }
      }
      intent.putExtras(valuesList.toBundle())
    }
    params.flags?.let { intent.addFlags(it) }
    params.category?.let { intent.addCategory(it) }

    val activity = currentActivity ?: throw Exceptions.MissingActivity()
    reactContext.addActivityEventListener(activityEventListener)

    return suspendCancellableCoroutine { continuation ->
      if (!pendingResult.compareAndSet(null, continuation)) {
        throw ActivityAlreadyStartedException()
      }
      continuation.invokeOnCancellation { pendingResult.compareAndSet(continuation, null) }

      try {
        activity.startActivityForResult(intent, REQUEST_CODE)
      } catch (e: Throwable) {
        pendingResult.compareAndSet(continuation, null)
        throw e
      }
    }
  }

  @JS
  fun openApplication(packageName: String) {
    val launchIntent = androidContext.packageManager.getLaunchIntentForPackage(packageName)
      ?: throw PackageNotFoundException(packageName)
    val activity = currentActivity ?: throw Exceptions.MissingActivity()
    activity.startActivity(launchIntent)
  }

  @JS
  suspend fun getApplicationIcon(packageName: String): String = withContext(Dispatchers.IO) {
    val pm = androidContext.packageManager
    val appInfo = try {
      pm.getApplicationInfo(packageName, 0)
    } catch (_: PackageManager.NameNotFoundException) {
      throw PackageNotFoundException(packageName)
    }

    // Get the app icon as a base64-encoded string
    val iconDrawable = pm.getApplicationIcon(appInfo)
    val bitmap = if (iconDrawable is BitmapDrawable) {
      iconDrawable.bitmap
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && iconDrawable is AdaptiveIconDrawable) {
      val bitmap = createBitmap(iconDrawable.intrinsicWidth, iconDrawable.intrinsicHeight)
      val canvas = Canvas(bitmap)
      iconDrawable.setBounds(0, 0, canvas.width, canvas.height)
      iconDrawable.draw(canvas)
      bitmap
    } else {
      null
    }

    bitmap?.let {
      val outputStream = ByteArrayOutputStream()
      it.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      val iconBytes = outputStream.toByteArray()
      "data:image/png;base64," + Base64.encodeToString(iconBytes, Base64.NO_WRAP)
    } ?: ""
  }
}

private fun Map<String, Any>.toBundle(): Bundle = bundleOf(*this.toList().toTypedArray())
