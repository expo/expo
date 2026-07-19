// Keep in sync with webview-wrapper.tsx
// https://github.com/expo/expo/blob/main/packages/expo/src/dom/webview-wrapper.tsx
package expo.modules.logbox

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Color
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebView.setWebContentsDebuggingEnabled
import android.webkit.WebViewClient
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ExpoLogBoxWebViewWrapper(
  val actions: Actions,
  val props: Map<String, Any>,
  val context: Activity
) {
  val webView: WebView = WebView(context).apply {
    setBackgroundColor(Color.BLACK)
    settings.javaScriptEnabled = true
    setWebContentsDebuggingEnabled(true)
    // This interface is defined by the Expo DOM Components WebView Wrapper
    // and must always be the same as [add link]
    addJavascriptInterface(
      object : Any() {
        @JavascriptInterface
        fun postMessage(rawMessage: String) {
          processMessageFromWebView(rawMessage)
        }
      },
      "ReactNativeWebView"
    )
    webViewClient = object : WebViewClient() {
      override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        initializeLogBoxDomEnvironment()
      }
    }

    // TODO: use build config to specify the dev url
    // webView.loadUrl("http://10.0.2.2:8090/")
    loadUrl("file:///android_asset/ExpoLogBox.bundle/index.html")
  }

  private fun initializeLogBoxDomEnvironment() {
    val initialProps = mapOf(
      "names" to actions.getNames(),
      "props" to props
    )

    val gson = Gson()
    val jsonObject = gson.toJson(initialProps)

    val devServerOrigin = "http://${AndroidInfoHelpers.getServerHost(context)}"
    val script = """
            var process=globalThis.process||{};process.env=process.env||{};
            process.env.EXPO_DEV_SERVER_ORIGIN='$devServerOrigin';
            window.$$${"EXPO_DOM_HOST_OS"} = 'android';
            window.$$${"EXPO_INITIAL_PROPS"} = $jsonObject;
    """.trimIndent()

    webView.post {
      webView.evaluateJavascript(script, null)
    }
  }

  private fun processMessageFromWebView(rawMessage: String) {
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

      when (actionId.asString) {
        "onReload" -> {
          actions.onReload.action()
        }
        "fetchTextAsync" -> {
          CoroutineScope(Dispatchers.Default).launch {
            val url = when {
              args.get(0).isJsonPrimitive &&
                args.get(0).asJsonPrimitive.isString
              -> args.get(0).asJsonPrimitive.asString
              else -> null
            }
            val options = args.get(1).asJsonObject
            val method = when {
              options.has("method") &&
                options.get("method").isJsonPrimitive &&
                options.getAsJsonPrimitive("method").isString
              -> options.getAsJsonPrimitive("method").asString
              else -> null
            }
            val body = when {
              options.has("body") &&
                options.get("body").isJsonPrimitive &&
                options.getAsJsonPrimitive("body").isString
              -> options.getAsJsonPrimitive("body").asString
              else -> null
            }

            if (url != null) {
              actions.fetchTextAsync.action(
                url,
                method ?: "GET",
                body ?: "",
                { result ->
                  sendReturn(result, uid.asString, actionId.asString)
                },
                { exception ->
                  sendReturn(exception, uid.asString, actionId.asString)
                }
              )
            }
          }
        }
      }
    }
  }

  fun sendReturn(result: Any, uid: String, actionId: String) {
    sendReturn(
      mapOf(
        "type" to NATIVE_ACTION_RESULT,
        "data" to mapOf(
          "uid" to uid,
          "actionId" to actionId,
          "result" to result
        )
      )
    )
  }

  fun sendReturn(exception: Exception, uid: String, actionId: String) {
    sendReturn(
      mapOf(
        "type" to NATIVE_ACTION_RESULT,
        "data" to mapOf(
          "uid" to uid,
          "actionId" to actionId,
          "error" to mapOf(
            "message" to "$exception"
          )
        )
      )
    )
  }

  fun sendReturn(data: Map<String, Any>) {
    sendReturn(
      Gson().toJson(
        mapOf(
          "detail" to data
        )
      )
    )
  }

  fun sendReturn(value: String) {
    val injectedJavascript = """
            ;
            (function() {
                try {
                    console.log("received", $value)
                    window.dispatchEvent(new CustomEvent("${DOM_EVENT}", $value));
                } catch (e) {
                    console.log('error', e)
                }
            })();
            true;
            """
    webView.post {
      webView.evaluateJavascript(injectedJavascript, null)
    }
  }

  companion object {
    private const val DOM_EVENT = "$\$dom_event"
    private const val NATIVE_ACTION_RESULT = "$\$native_action_result"
    private const val NATIVE_ACTION = "$\$native_action"
  }

  data class Actions(
    val onReload: OnReload,
    val fetchTextAsync: FetchTextAsync
  ) {
    fun getNames(): Array<String> {
      return arrayOf(
        onReload.name,
        fetchTextAsync.name
      )
    }

    data class OnReload(
      val action: () -> Unit,
      val name: String = "onReload"
    )

    data class FetchTextAsync(
      val action: (
        url: String,
        method: String,
        body: String,
        onResult: (String) -> Unit,
        onFailure: (Exception) -> Unit
      ) -> Unit,
      val name: String = "fetchTextAsync"
    )
  }
}
