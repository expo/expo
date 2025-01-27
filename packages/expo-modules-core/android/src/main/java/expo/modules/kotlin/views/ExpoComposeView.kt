package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.ComposeView
import expo.modules.kotlin.AppContext
import androidx.compose.ui.InternalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.viewinterop.AndroidView

/**
 * A base class that should be used by compose views.
 */
abstract class ExpoComposeView<T : ComposeProps>(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext) {
  open val props: T? = null

  override val shouldUseAndroidLayout = true

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // In case of issues there's an alternative solution in previous commits at https://github.com/expo/expo/pull/33759
    if (!isAttachedToWindow) {
      setMeasuredDimension(widthMeasureSpec, heightMeasureSpec)
      return
    }
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }

  override fun addView(child: View?, index: Int) {
    println("${child?.javaClass?.simpleName} added to ${this.javaClass.simpleName}, index ${index}")
    if(child != null && child !is ComposeView) {
//      super.addView(child, index)
      props?.children?.add(index, child)
    } else {
      super.addView(child, index)
    }
  }

  @Composable
  fun Children() {
    for (child in props?.children.orEmpty()) {
      AndroidView(modifier = Modifier.fillMaxSize(), factory = { context ->
        // Creates view
        child
      })
    }
  }

  @OptIn(InternalComposeUiApi::class)
  val layout by lazy {
    ComposeView(context).also {
      it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      it.setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
      addView(it)
    }
  }

  fun setContent(
    content: @Composable () -> Unit
  ) {
    layout.setContent { content() }
  }
}
