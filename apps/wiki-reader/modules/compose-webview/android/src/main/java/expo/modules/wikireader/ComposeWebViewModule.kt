package expo.modules.wikireader

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ComposeWebViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ComposeWebViewModule")

    View(ComposeWebView::class) {
      Events("onLoadingProgressChanged")

      AsyncFunction("loadUrl") Coroutine { view: ComposeWebView, url: String ->
        return@Coroutine view.loadUrlAsync(url)
      }
      AsyncFunction("reload") Coroutine { view: ComposeWebView ->
        return@Coroutine view.reloadAsync()
      }
    }
  }
}
