package expo.modules.logbox

import android.app.Activity
import android.app.Dialog
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebView.setWebContentsDebuggingEnabled
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
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
    private var webView: WebView? = null

    override fun createContentView(appKey: String) {
        // Noop
    }

    override fun isContentViewReady(): Boolean {
        return true
    }

    override fun destroyContentView() {
        // Noop
    }

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
        dialog = Dialog(context, android.R.style.Theme_DeviceDefault_NoActionBar_Fullscreen)
        val rootContainer = FrameLayout(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.argb(102, 0, 0, 0))
        }


        // Create a simple layout programmatically
        webView = WebView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )

            setBackgroundColor(Color.TRANSPARENT)
            settings.javaScriptEnabled = true
            webViewClient = WebViewClient()
            setWebContentsDebuggingEnabled(true);
            overScrollMode = View.OVER_SCROLL_ALWAYS
        }

        val savedInsets = WindowInsetsCompat.toWindowInsetsCompat(context.window.decorView.rootWindowInsets)
            .getInsets(WindowInsetsCompat.Type.systemBars())

        webView?.addJavascriptInterface(object : Any() {
            @JavascriptInterface
            fun postMessage(rawMessage: String) {
                val gson = Gson()
                val jsonObject = gson.fromJson(rawMessage, JsonObject::class.java)

                val messageType = jsonObject.getAsJsonPrimitive("type")

                if (messageType.isString && messageType.asString == NATIVE_ACTION) {
                    val data = jsonObject.getAsJsonObject("data")
                    val actionId = data.getAsJsonPrimitive("actionId")
                    val uid = data.getAsJsonPrimitive("uid")
                    val args = data.getAsJsonArray("args")
                    if (!actionId.isString || !uid.isString || !args.isJsonArray) {
                        return
                    }

                    when(actionId.asString) {
                        "reloadRuntime" -> { reloadRuntime() }
                        "fetchJsonAsync" -> {
                            CoroutineScope(Dispatchers.Default).launch {
                                val url = when {
                                    args.get(0).isJsonPrimitive
                                            && args.get(0).asJsonPrimitive.isString
                                                -> args.get(0).asJsonPrimitive.asString
                                    else -> null
                                }
                                val options = args.get(1).asJsonObject
                                val method = when {
                                    options.has("method")
                                            && options.get("method").isJsonPrimitive
                                            && options.getAsJsonPrimitive("method").isString
                                                -> options.getAsJsonPrimitive("method").asString
                                    else -> null
                                }
                                val body = when {
                                    options.has("body")
                                            && options.get("body").isJsonPrimitive
                                            && options.getAsJsonPrimitive("body").isString
                                        -> options.getAsJsonPrimitive("body").asString
                                    else -> null
                                }

                                if (url != null) {
                                    fetchJsonAsync(
                                        url,
                                        method ?: "GET",
                                        body ?: "",
                                        { result ->
                                            sendReturn(result, uid.asString, actionId.asString)
                                        },
                                        { exception ->
                                            sendReturn(exception, uid.asString, actionId.asString)
                                        },
                                    )
                                }
                            }

                        }
                    }
                }

            }
        }, "ReactNativeWebView")

        webView?.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                val safeAreaJs = """
                    document.documentElement.style.setProperty('--android-safe-area-inset-left', '${(savedInsets?.left ?: 0) / context.resources.displayMetrics.density}px');
                    document.documentElement.style.setProperty('--android-safe-area-inset-right', '${(savedInsets?.right ?: 0) / context.resources.displayMetrics.density}px');
                    document.documentElement.style.setProperty('--android-safe-area-inset-top', '${(savedInsets?.top ?: 0) / context.resources.displayMetrics.density}px');
                    document.documentElement.style.setProperty('--android-safe-area-inset-bottom', '${(savedInsets?.bottom ?: 0) / context.resources.displayMetrics.density}px');
                """.trimIndent()
                webView?.post {
                    webView?.evaluateJavascript(safeAreaJs, null)
                }
            }

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

                webView?.post {
                    webView?.evaluateJavascript(script, null)
                }
            }
        }

        webView?.loadUrl("file:///android_asset/ExpoLogBox.bundle/index.html")
        // TODO: use build config to specify the dev url
        // webView.loadUrl("http://10.0.2.2:8082/")

        dialog?.window?.apply {
            setLayout(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT
            )
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
            WindowCompat.setDecorFitsSystemWindows(this, false)
            decorView.post {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    insetsController?.show(WindowInsets.Type.statusBars())
                }
            }
        }
        rootContainer.addView(webView)
        dialog?.setContentView(rootContainer)
        dialog?.show()
    }

    override fun hide() {
        dialog?.dismiss()
        // TODO: destroy the view
    }

    override fun isShowing(): Boolean {
        return dialog?.isShowing == true
    }

    fun reloadRuntime() {
        devSupportManager.handleReloadJS()
    }

    fun fetchJsonAsync(
        url: String,
        method: String,
        body: String,
        onResult: (String) -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        val client = OkHttpClient()

        val requestBody = if (method.uppercase() != "GET") {
            body.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
        } else null

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

    fun sendReturn(result: Any, uid: String, actionId: String) {
        sendReturn(mapOf(
            "type" to NATIVE_ACTION_RESULT,
            "data" to mapOf(
                "uid" to uid,
                "actionId" to actionId,
                "result" to result
            )
        ))
    }

    fun sendReturn(exception: Exception, uid: String, actionId: String) {
        sendReturn(mapOf(
            "type" to NATIVE_ACTION_RESULT,
            "data" to mapOf(
                "uid" to uid,
                "actionId" to actionId,
                "error" to mapOf(
                    "message" to "$exception"
                )
            )
        ))
    }

    fun sendReturn(data: Map<String, Any>) {
        sendReturn(Gson().toJson(mapOf(
            "detail" to data
        )))
    }

    fun sendReturn(value: String) {
        val injectedJavascript = """
            ;
            (function() {
                try {
                    console.log("received", $value)
                    window.dispatchEvent(new CustomEvent("$DOM_EVENT", $value));
                } catch (e) {
                    console.log('error', e)
                }
            })();
            true;
            """
        webView?.post {
            webView?.evaluateJavascript(injectedJavascript, null)
        }
    }

    companion object {
        private val DOM_EVENT = "$\$dom_event"
        private val NATIVE_ACTION_RESULT = "$\$native_action_result"
        private val NATIVE_ACTION = "$\$native_action"

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
