package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.ComposeView
import expo.modules.kotlin.AppContext
import androidx.compose.ui.InternalComposeUiApi
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.view.children

/**
 * A base class that should be used by compose views.
 */
abstract class ExpoComposeView<T : ComposeProps>(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext) {
  open val props: T? = null

  private var content: @Composable () -> Unit = {}

  override val shouldUseAndroidLayout = true

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // In case of issues there's an alternative solution in previous commits at https://github.com/expo/expo/pull/33759
    if (!isAttachedToWindow) {
      setMeasuredDimension(widthMeasureSpec, heightMeasureSpec)
      return
    }
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }

  @Composable
  fun UnwrappedChildren() {
    layout.children.filter { it is ExpoComposeView<*> }.map { (it as ExpoComposeView<*>).content }.forEach { it() }
  }

  @OptIn(InternalComposeUiApi::class)
  val layout by lazy {
    ComposeView(context).also {
      it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      it.setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
      addView(it)
      it.addOnAttachStateChangeListener(object : OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(v: View) {
          it.disposeComposition()
        }

        override fun onViewDetachedFromWindow(v: View) = Unit
      })
    }
  }

  fun setContent(
    content: @Composable () -> Unit
  ) {
    this.content = content
    layout.setContent { content() }
  }
}
