package expo.modules.logbox

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Dialog
import android.graphics.Bitmap
import android.graphics.Color
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebView.setWebContentsDebuggingEnabled
import android.webkit.WebViewClient
import android.widget.FrameLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.gson.Gson
import com.google.gson.JsonObject

class ExpoLogBoxSurfaceDelegate(private val devSupportManager: DevSupportManager) :
    SurfaceDelegate {

    private var dialog: Dialog? = null

    override fun createContentView(appKey: String) {
        // Noop
    }

    override fun isContentViewReady(): Boolean {
        return true
    }

    override fun destroyContentView() {
        // Noop
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun show() {
        val context: Activity? = devSupportManager.currentActivity
        if (context == null || context.isFinishing) {
            devSupportManager.currentReactContext?.let { reactContext ->
                /**
                 * If the activity isn't available, try again after the next onHostResume(). onHostResume()
                 * is when the activity gets attached to the react native.
                 */
                // TODO: Add
                runAfterHostResume(reactContext) { this.show() }
                return
            }
            return
        }

        // Create the BottomSheetDialog
        dialog = BottomSheetDialog(context)

        dialog?.setOnShowListener { d ->
            val bottomSheet = (d as BottomSheetDialog)
                .findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)

            bottomSheet?.setBackgroundColor(Color.TRANSPARENT)

            bottomSheet?.let {
                val behavior = BottomSheetBehavior.from(it)
                behavior.state = BottomSheetBehavior.STATE_EXPANDED
                behavior.skipCollapsed = true

                val layoutParams = it.layoutParams
                layoutParams.height = ViewGroup.LayoutParams.MATCH_PARENT
                it.layoutParams = layoutParams
            }
        }

        // Create a simple layout programmatically
        val webView = WebView(context).apply {
            setBackgroundColor(Color.TRANSPARENT)
            settings.javaScriptEnabled = true
            webViewClient = WebViewClient()
            setWebContentsDebuggingEnabled(true);
        }

        webView.addJavascriptInterface(object : Any() {
            @JavascriptInterface
            fun postMessage(rawMessage: String) {
                val gson = Gson()
                val jsonObject = gson.fromJson(rawMessage, JsonObject::class.java)

                val messageType = jsonObject.getAsJsonPrimitive("type")

                if (messageType.isString && messageType.asString == "\$\$native_action") {
                    val data = jsonObject.getAsJsonObject("data")
                    val actionId = data.getAsJsonPrimitive("actionId")
                    if (!actionId.isString) {
                        return
                    }

                    when(actionId.asString) {
                        "reloadRuntime" -> { devSupportManager.handleReloadJS() }
                        "fetchJsonAsync" -> { print("fetchJsonAsync") }
                    }
                }

            }
        }, "ReactNativeWebView")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)

                val errorMessage = devSupportManager.lastErrorTitle
                val errorMessages = errorMessage?.let { arrayOf(it) } ?: emptyArray<String>()

                val initialProps = mapOf(
                    "names" to arrayOf(
                        "fetchJsonAsync",
                        "reloadRuntime",
                    ),
                    "props" to mapOf(
                        "platform" to "android",
                        "nativeLogs" to errorMessages
                    ),
                )

                val gson = Gson()
                val jsonObject = gson.toJson(initialProps)

                val script = """
                    var process=globalThis.process||{};process.env=process.env||{};process.env.EXPO_DEV_SERVER_ORIGIN='http://10.0.2.2:8081';
                    window.$$${"EXPO_INITIAL_PROPS"} = ${jsonObject};
                """.trimIndent()

                webView.post {
                    webView.evaluateJavascript(script, null)
                }
            }
        }

        webView.loadUrl("file:///android_asset/ExpoLogBox.bundle/index.html")
        // TODO: use build config to specify the dev url
        // webView.loadUrl("http://10.0.2.2:8082/")

        dialog?.setContentView(webView)
        dialog?.show()
    }

    override fun hide() {
        dialog?.dismiss()
        // TODO: destroy the view
    }

    override fun isShowing(): Boolean {
        return dialog?.isShowing == true
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
