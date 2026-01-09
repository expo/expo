package expo.modules.wikireader

import android.content.Context
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.ExpoModifier
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

data class ComposeWebViewProps(
  val url: MutableState<String> = mutableStateOf(""),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class ComposeWebView(context: Context, appContext: AppContext) : ExpoComposeView<ComposeWebViewProps>(context, appContext) {
  override val props = ComposeWebViewProps()
  private var reloadDeferred: CompletableDeferred<Unit>? = null
  private val mutex = Mutex()

  private val webView by lazy {
    WebView(context).apply {
      settings.javaScriptEnabled = true
      settings.domStorageEnabled = true
      webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
          super.onPageFinished(view, url)
          reloadDeferred?.complete(Unit)
          reloadDeferred = null
        }
      }
    }
  }

  @Composable
  override fun ComposableScope.Content() {
    val (url) = props.url

    LaunchedEffect(url) {
      webView.loadUrl(url)
    }

    AndroidView(
      modifier = Modifier.verticalScroll(rememberScrollState()),
      factory = { webView },
    )
  }

  suspend fun loadUrlAsync(url: String) {
    mutex.withLock {
      webView.loadUrl(url)
    }
  }

  suspend fun reloadAsync() {
    mutex.withLock {
      reloadDeferred = CompletableDeferred()
      webView.reload()
      reloadDeferred?.await()
    }
  }
}
