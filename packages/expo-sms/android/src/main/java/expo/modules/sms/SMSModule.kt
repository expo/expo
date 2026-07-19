package expo.modules.sms

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Telephony
import androidx.core.os.bundleOf
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SMSModule : Module(), LifecycleEventListener {
  private var pendingPromise: Promise? = null
  private var smsComposerOpened = false

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoSMS")

    OnCreate {
      val uiManager = appContext.legacyModule<UIManager>()
      uiManager?.registerLifecycleEventListener(this@SMSModule)
    }

    AsyncFunction("sendSMSAsync") { addresses: List<String>, message: String, options: SMSOptions, promise: Promise ->
      sendSMSAsync(addresses, message, options, promise)
    }

    AsyncFunction<Boolean>("isAvailableAsync") {
      return@AsyncFunction context.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)
    }

    OnDestroy {
      val uiManager = appContext.legacyModule<UIManager>()
      uiManager?.unregisterLifecycleEventListener(this@SMSModule)
    }
  }

  private fun sendSMSAsync(addresses: List<String>, message: String, options: SMSOptions, promise: Promise) {
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

    val defaultSMSPackage = Telephony.Sms.getDefaultSmsPackage(context)
    defaultSMSPackage?.let {
      smsIntent.setPackage(it)
    } ?: throw MissingSMSAppException()

    smsIntent.apply {
      putExtra("exit_on_sent", true)
      putExtra("compose_mode", true)
      putExtra("sms_body", message)
    }

    pendingPromise = promise
    appContext.throwingActivity.startActivity(smsIntent)
    smsComposerOpened = true
  }

  override fun onHostResume() {
    val promise = pendingPromise
    if (smsComposerOpened && promise != null) {
      // the only way to check the status of the message is to query the device's SMS database
      // but this requires READ_SMS permission, which Google is heavily restricting beginning Jan 2019
      // so we just resolve with an unknown value
      promise.resolve(
        bundleOf(Pair("result", "unknown"))
      )
      pendingPromise = null
    }
    smsComposerOpened = false
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit
}
