package expo.modules.sharing

import android.content.Intent
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Parcelable
import androidx.core.net.toUri
import com.facebook.react.ReactActivity
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.net.URL

// Emits intent received event to JS. This is because the `SEND` and `SEND_MULTIPLE` intents
// have no uri and do not inform the navigation libraries of a native intent.
// This aligns the behaviour with ios
internal fun getShareScheme(context: Context): String? {
  val packageName = context.packageName
  val resId = context.resources.getIdentifier("share_into_scheme", "string", packageName)

  if (resId == 0) {
    return null
  }

  return context.getString(resId)
}

internal fun getShareIntentUri(context: Context): Uri? {
  val scheme = getShareScheme(context) ?: return null
  return "$scheme://expo-sharing".toUri()
}

// Emits intent received event to JS. This is because the `SEND` and `SEND_MULTIPLE` intents
// do not navigation libraries of a native intent. This aligns the behaviour with ios.
internal fun emitShareIntentReceived(reactActivity: ReactActivity, originalIntent: Intent) {
  SharingSingleton.intent = originalIntent

  val currentContext = reactActivity.reactDelegate?.reactHost?.currentReactContext
  val deviceEventManagerModule =
    currentContext?.getNativeModule(DeviceEventManagerModule::class.java)

  getShareIntentUri(reactActivity)?.let { uri ->
    deviceEventManagerModule?.emitNewIntentReceived(uri)
  }
}

internal fun isShareIntent(intent: Intent): Boolean {
  val allowedShareActions =
    listOf("android.intent.action.SEND", "android.intent.action.SEND_MULTIPLE")

  return intent.type != null && allowedShareActions.contains(intent.action)
}

internal inline fun <reified T : Parcelable> Intent.getParcelableExtraCompat(name: String): T? {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getParcelableExtra(name, T::class.java)
  } else {
    @Suppress("DEPRECATION")
    getParcelableExtra<T>(name)
  }
}

internal inline fun <reified T : Parcelable> Intent.getParcelableArrayListExtraCompat(name: String): ArrayList<T>? {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getParcelableArrayListExtra(name, T::class.java)
  } else {
    @Suppress("DEPRECATION")
    getParcelableArrayListExtra<T>(name)
  }
}

internal val URL.lastPathComponent: String
  get() = path.removeSuffix("/").substringAfterLast('/')
