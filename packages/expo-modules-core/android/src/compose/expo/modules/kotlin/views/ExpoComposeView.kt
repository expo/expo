package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.RowScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.CoalescingKey
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.viewevent.ViewEventDelegate

data class ComposableScope(
  val rowScope: RowScope? = null,
  val columnScope: ColumnScope? = null,
  val boxScope: BoxScope? = null
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
  abstract fun ComposableScope.Content()

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
  fun Children(composableScope: ComposableScope?) {
    for (index in 0..<this.size) {
      val child = getChildAt(index) as? ExpoComposeView<*> ?: continue
      with(composableScope ?: ComposableScope()) {
        with(child) {
          Content()
        }
      }
    }
  }

  @Composable
  fun Child(composableScope: ComposableScope, index: Int) {
    val child = getChildAt(index) as? ExpoComposeView<*> ?: return
    with(composableScope) {
      with(child) {
        Content()
      }
    }
  }

  @Composable
  fun Child(index: Int) {
    Child(ComposableScope(), index)
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
        with(ComposableScope()) {
          Content()
        }
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

class ExpoViewComposableScope(val view: ComposeFunctionHolder<*>) {
  @Composable
  fun Child(composableScope: ComposableScope, index: Int) {
    view.Child(composableScope, index)
  }

  @Composable
  fun Child(index: Int) {
    view.Child(index)
  }

  @Composable
  fun Children(composableScope: ComposableScope?) {
    view.Children(composableScope)
  }

  inline fun <reified T> EventDispatcher(noinline coalescingKey: CoalescingKey<T>? = null): ViewEventDelegate<T> {
    return view.EventDispatcher<T>(coalescingKey)
  }
}

class ComposeFunctionHolder<P : ComposeProps>(
  context: Context,
  appContext: AppContext,
  private val composableContent: @Composable ExpoViewComposableScope.(props: P) -> Unit,
  props: P
) : ExpoComposeView<P>(context, appContext) {
  override var props: P? = props
  private var key by mutableIntStateOf(0)
  val scope = ExpoViewComposableScope(this)

  fun recompose() {
    key++
  }

  @Composable
  override fun ComposableScope.Content() {
    LaunchedEffect(key) {}
    with(scope) {
      composableContent(props ?: return)
    }
  }
}
