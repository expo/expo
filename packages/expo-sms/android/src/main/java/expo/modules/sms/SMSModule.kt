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

private const val OPTIONS_ATTACHMENTS_KEY = "attachments"

class SMSModule : Module(), LifecycleEventListener {
  private var mPendingPromise: Promise? = null
  private var mSMSComposerOpened = false

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val currentActivity
    get() = appContext.activityProvider?.currentActivity
      ?: throw MissingCurrentActivityException()

  override fun definition() = ModuleDefinition {
    Name("ExpoSMS")

    OnCreate {
      val uiManager = appContext.legacyModule<UIManager>()
      uiManager?.registerLifecycleEventListener(this@SMSModule)
    }

    OnDestroy {
      val uiManager = appContext.legacyModule<UIManager>()
      uiManager?.unregisterLifecycleEventListener(this@SMSModule)
    }

    AsyncFunction("sendSMSAsync") { addresses: ArrayList<String>, message: String, options: Map<String, Any?>?, promise: Promise ->
      val attachments = options?.get(OPTIONS_ATTACHMENTS_KEY) as? List<*>

      // ACTION_SEND causes a weird flicker on Android 10 devices if the messaging app is not already
      // open in the background, but it seems to be the only intent type that works for including
      // attachments, so we use it if there are attachments and fall back to ACTION_SENDTO otherwise.
      val smsIntent = if (attachments?.isNotEmpty() == true) {
        Intent(Intent.ACTION_SEND).apply {
          type = "text/plain"
          putExtra("address", addresses.joinToString(separator = ";"))
          val attachment = attachments[0] as? Map<String?, String?>
          putExtra(Intent.EXTRA_STREAM, Uri.parse(getAttachment(attachment, "uri")))
          type = getAttachment(attachment, "mimeType")
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
      } else {
        Intent(Intent.ACTION_SENDTO).apply {
          data = Uri.parse("smsto:" + addresses.joinToString(separator = ";"))
        }
      }

      val defaultSMSPackage = Telephony.Sms.getDefaultSmsPackage(context)

      if (defaultSMSPackage != null) {
        smsIntent.setPackage(defaultSMSPackage)
      } else {
        promise.reject(SMSNoSMSAppException())
        return@AsyncFunction
      }
      smsIntent.putExtra("exit_on_sent", true)
      smsIntent.putExtra("compose_mode", true)
      smsIntent.putExtra("sms_body", message)
      mPendingPromise = promise
      currentActivity.startActivity(smsIntent)

      mSMSComposerOpened = true
    }

    AsyncFunction("isAvailableAsync") { promise: Promise ->
      promise.resolve(context.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY))
    }
  }

  private fun getAttachment(attachment: Map<String?, String?>?, key: String): String? {
    return attachment?.get(key)
  }

  override fun onHostResume() {
    val promise = mPendingPromise
    if (mSMSComposerOpened && promise != null) {
      // the only way to check the status of the message is to query the device's SMS database
      // but this requires READ_SMS permission, which Google is heavily restricting beginning Jan 2019
      // so we just resolve with an unknown value
      promise.resolve(
        bundleOf(Pair("result", "unknown"))
      )
      mPendingPromise = null
    }
    mSMSComposerOpened = false
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit
}
