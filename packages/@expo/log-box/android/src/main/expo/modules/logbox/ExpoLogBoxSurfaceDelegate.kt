package expo.modules.logbox

import android.app.Activity
import android.app.Dialog
import android.widget.FrameLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.DevSupportManager
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException

class ExpoLogBoxSurfaceDelegate(private val devSupportManager: DevSupportManager) :
  SurfaceDelegate {
  private var dialog: Dialog? = null

  override fun createContentView(appKey: String) = Unit

  override fun isContentViewReady(): Boolean {
    return true
  }

  override fun destroyContentView() = Unit

  override fun show() {
    val context: Activity = devSupportManager.currentActivity ?: return
    if (context.isFinishing) {
      devSupportManager.currentReactContext?.let { reactContext ->
        /**
         * If the activity isn't available, try again after the next onHostResume(). onHostResume()
         * is when the activity gets attached to the react native.
         */
        runAfterHostResume(reactContext) { this.show() }
        return
      }
      return
    }

    dialog = Dialog(context, android.R.style.Theme_NoTitleBar)
    val rootContainer = FrameLayout(context).apply {
      fitsSystemWindows = true
    }

    val errorMessage = devSupportManager.lastErrorTitle
    val errorStack = devSupportManager.lastErrorStack?.map { frame ->
      mapOf(
        // Expected to match https://github.com/expo/expo/blob/5ed042a3547571fa70cf1d53db7c12b4bb966a90/packages/%40expo/log-box/src/devServerEndpoints.ts#L3
        "file" to frame.file,
        "methodName" to frame.method,
        "arguments" to emptyArray<String>(),
        "lineNumber" to frame.line,
        "column" to frame.column,
        "collapse" to frame.isCollapsed
      )
    }

    val webViewWrapper = ExpoLogBoxWebViewWrapper(
      actions = ExpoLogBoxWebViewWrapper.Actions(
        onReload = ExpoLogBoxWebViewWrapper.Actions.OnReload(onReload),
        fetchTextAsync = ExpoLogBoxWebViewWrapper.Actions.FetchTextAsync(fetchTextAsync)
      ),
      props = mapOf(
        "platform" to "android",
        "nativeLogs" to arrayOf(
          mapOf(
            "message" to errorMessage,
            "stack" to errorStack
          )
        )
      ),
      context
    )
    rootContainer.addView(webViewWrapper.webView)
    dialog?.setContentView(rootContainer)
    dialog?.show()
  }

  override fun hide() {
    // Build Errors are generally not dismissable
    // NOTE: The hide function is also called also when application goes to background
    // which causes the error disappear and leave the app on black screen
    dialog?.dismiss()
  }

  override fun isShowing(): Boolean {
    return dialog?.isShowing == true
  }

  private val onReload = {
    devSupportManager.handleReloadJS()
  }

  private val fetchTextAsync = {
      url: String,
      method: String,
      body: String,
      onResult: (String) -> Unit,
      onFailure: (Exception) -> Unit
    ->
    val client = OkHttpClient()

    val requestBody = if (method.uppercase() != "GET") {
      body.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
    } else {
      null
    }

    val request = Request.Builder()
      .url(url)
      .method(method.uppercase(), requestBody)
      .build()

    client.newCall(request).enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        onFailure(e)
      }

      override fun onResponse(call: Call, response: Response) {
        response.use {
          val responseBody = it.body?.string() ?: "{}"
          onResult(responseBody)
        }
      }
    })
  }

  companion object {
    private fun runAfterHostResume(reactContext: ReactContext, runnable: Runnable) {
      reactContext.addLifecycleEventListener(
        object : LifecycleEventListener {
          override fun onHostResume() {
            runnable.run()
            reactContext.removeLifecycleEventListener(this)
          }

          override fun onHostPause() = Unit

          override fun onHostDestroy() = Unit
        }
      )
    }
  }
}
