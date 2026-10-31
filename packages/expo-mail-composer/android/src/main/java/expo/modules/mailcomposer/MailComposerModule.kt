package expo.modules.mailcomposer

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ActivityEventListener
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

// TODO: Rename the package to 'ExpoMail'
@ExpoModule("ExpoMailComposer")
class MailComposerModule : Module() {
  private val pendingResult = AtomicReference<CancellableContinuation<MailComposerResult>?>(null)

  private val activityEventListener = object : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CODE) {
        return
      }
      pendingResult.getAndSet(null)?.resume(MailComposerResult(status = "sent"))
    }

    override fun onNewIntent(intent: Intent) = Unit
  }

  override fun onDestroy() {
    reactContextOrNull?.removeActivityEventListener(activityEventListener)
  }

  @JS
  suspend fun isAvailableAsync(): Boolean = withContext(Dispatchers.IO) {
    try {
      val intent = Intent(Intent.ACTION_SENDTO).apply { data = Uri.parse(MAILTO_URI) }
      val packageManager = androidContext.packageManager
      packageManager != null && intent.resolveActivity(packageManager) != null
    } catch (e: Exception) {
      throw ResolveActivityException(e)
    }
  }

  @JS
  fun getClients(): List<MailClient> {
    return getAvailableMailClients()
  }

  @JS
  suspend fun composeAsync(options: MailComposerOptions): MailComposerResult {
    val activity = currentActivity ?: throw Exceptions.MissingActivity()
    val intent = Intent(Intent.ACTION_SENDTO).apply { data = Uri.parse(MAILTO_URI) }
    val application = activity.application
    val resolveInfo = androidContext.packageManager.queryIntentActivities(intent, 0)

    val mailIntents = resolveInfo.map { info ->
      val mailIntentBuilder = MailIntentBuilder(options)
        .setComponentName(info.activityInfo.packageName, info.activityInfo.name)
        .putRecipients(Intent.EXTRA_EMAIL)
        .putCcRecipients(Intent.EXTRA_CC)
        .putBccRecipients(Intent.EXTRA_BCC)
        .putSubject(Intent.EXTRA_SUBJECT)
        .putBody(Intent.EXTRA_TEXT, options.isHtml == true)
        .putAttachments(Intent.EXTRA_STREAM, application)
      mailIntentBuilder.build()
    }.toMutableList()

    val primaryIntent = mailIntents.removeAt(mailIntents.size - 1)
    val chooser = Intent.createChooser(primaryIntent, null).apply {
      putExtra(Intent.EXTRA_INITIAL_INTENTS, mailIntents.toTypedArray())
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }

    reactContext.addActivityEventListener(activityEventListener)

    return suspendCancellableCoroutine { continuation ->
      pendingResult.set(continuation)
      continuation.invokeOnCancellation { pendingResult.compareAndSet(continuation, null) }

      try {
        activity.startActivityForResult(chooser, REQUEST_CODE)
      } catch (e: Throwable) {
        pendingResult.compareAndSet(continuation, null)
        throw e
      }
    }
  }

  // Function to get available mail clients
  private fun getAvailableMailClients(): List<MailClient> {
    val emailIntent = Intent(Intent.ACTION_SENDTO).apply {
      data = Uri.parse(MAILTO_URI)
    }
    val pm = androidContext.packageManager
    val resolveInfoList = pm.queryIntentActivities(emailIntent, 0)

    return resolveInfoList.map { resolveInfo ->
      val packageName = resolveInfo.activityInfo.packageName
      val appInfo = pm.getApplicationInfo(packageName, 0)
      val appName = pm.getApplicationLabel(appInfo).toString()

      MailClient(label = appName, packageName = packageName)
    }
  }

  companion object {
    private const val REQUEST_CODE = 8675
    private const val MAILTO_URI = "mailto:"
  }
}
