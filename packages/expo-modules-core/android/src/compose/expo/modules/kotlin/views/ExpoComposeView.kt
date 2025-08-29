package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.RowScope
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.view.size
import expo.modules.kotlin.AppContext

data class ComposableScope(
  var rowScope: RowScope? = null,
  var columnScope: ColumnScope? = null,
  // still experimental, so we comment it out for now
  //  val flowRowScope: FlowRowScope? = null,
  //  var flowColumnScope: FlowColumnScope? = null,
  var boxScope: BoxScope? = null
)

fun ComposableScope.with(rowScope: RowScope?): ComposableScope {
  return this.copy(rowScope = rowScope)
}

fun ComposableScope.with(columnScope: ColumnScope?): ComposableScope {
  return this.copy(columnScope = columnScope)
}

fun ComposableScope.with(boxScope: BoxScope?): ComposableScope {
  return this.copy(boxScope = boxScope)
}

/**
 * A base class that should be used by compose views.
 */
abstract class ExpoComposeView<T : ComposeProps>(
  context: Context,
  appContext: AppContext,
  private val withHostingView: Boolean = false
) : ExpoView(context, appContext) {
  open val props: T? = null

  @Composable
  abstract fun Content(composableScope: ComposableScope = ComposableScope())

  override val shouldUseAndroidLayout = withHostingView

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // In case of issues there's an alternative solution in previous commits at https://github.com/expo/expo/pull/33759
    if (shouldUseAndroidLayout && !isAttachedToWindow) {
      setMeasuredDimension(widthMeasureSpec, heightMeasureSpec)
      return
    }
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }

  @Composable
  protected fun Children(composableScope: ComposableScope) {
    if (withHostingView) {
      Content(composableScope)
      return
    }

    for (index in 0..<this.size) {
      val child = getChildAt(index) as? ExpoComposeView<*> ?: continue
      child.Content(composableScope)
    }
  }

  init {
    if (withHostingView) {
      addComposeView()
    } else {
      this.visibility = GONE
      this.setWillNotDraw(true)
    }
  }

  private fun addComposeView() {
    val composeView = ComposeView(context).also {
      it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      it.setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
      it.setContent {
        Children(ComposableScope())
      }
      it.addOnAttachStateChangeListener(object : OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(v: View) {
          it.disposeComposition()
        }

        override fun onViewDetachedFromWindow(v: View) = Unit
      })
    }
    addView(composeView)
  }

  override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
    val view = if (child !is ExpoComposeView<*> && child !is ComposeView) {
      ExpoComposeAndroidView(child, appContext)
    } else {
      child
    }
    super.addView(view, index, params)
  }
}
