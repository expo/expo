package expo.modules.sms

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Telephony
import com.facebook.react.bridge.LifecycleEventListener
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
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.resume

@ExpoModule("ExpoSMS")
class SMSModule : Module() {
  private val pendingResult = AtomicReference<CancellableContinuation<SMSResult>?>(null)

  @Volatile
  private var smsComposerOpened = false

  private val lifecycleListener = object : LifecycleEventListener {
    override fun onHostResume() {
      val continuation = pendingResult.get()
      if (smsComposerOpened && continuation != null) {
        // the only way to check the status of the message is to query the device's SMS database
        // but this requires READ_SMS permission, which Google is heavily restricting beginning Jan 2019
        // so we just resolve with an unknown value
        if (pendingResult.compareAndSet(continuation, null)) {
          continuation.resume(SMSResult(result = "unknown"))
        }
      }
      smsComposerOpened = false
    }

    override fun onHostPause() = Unit

    override fun onHostDestroy() = Unit
  }

  override fun onDestroy() {
    reactContextOrNull?.removeLifecycleEventListener(lifecycleListener)
  }

  @JS
  suspend fun sendSMSAsync(addresses: List<String>, message: String, options: SMSOptions): SMSResult {
    // ACTION_SEND causes a weird flicker on Android 10 devices if the messaging app is not already
    // open in the background, but it seems to be the only intent type that works for including
    // attachments, so we use it if there are attachments and fall back to ACTION_SENDTO otherwise.
    val smsIntent = if (options.attachments.isNotEmpty()) {
      Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra("address", addresses.joinToString(separator = ";"))
        val attachment = options.attachments[0]
        putExtra(Intent.EXTRA_STREAM, Uri.parse(attachment.uri))
        type = attachment.mimeType
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
    } else {
      Intent(Intent.ACTION_SENDTO).apply {
        data = Uri.parse("smsto:" + addresses.joinToString(separator = ";"))
      }
    }

    val defaultSMSPackage = Telephony.Sms.getDefaultSmsPackage(androidContext)
    defaultSMSPackage?.let {
      smsIntent.setPackage(it)
    } ?: throw MissingSMSAppException()

    smsIntent.apply {
      putExtra("exit_on_sent", true)
      putExtra("compose_mode", true)
      putExtra("sms_body", message)
    }

    val activity = currentActivity ?: throw Exceptions.MissingActivity()
    reactContext.addLifecycleEventListener(lifecycleListener)

    return suspendCancellableCoroutine { continuation ->
      pendingResult.set(continuation)
      continuation.invokeOnCancellation { pendingResult.compareAndSet(continuation, null) }

      try {
        activity.startActivity(smsIntent)
      } catch (e: Throwable) {
        pendingResult.compareAndSet(continuation, null)
        throw e
      }
      smsComposerOpened = true
    }
  }

  @JS
  suspend fun isAvailableAsync(): Boolean = withContext(Dispatchers.IO) {
    androidContext.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)
  }
}
