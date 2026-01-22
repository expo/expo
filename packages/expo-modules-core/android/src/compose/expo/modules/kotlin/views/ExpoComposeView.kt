package expo.modules.kotlin.views

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.RowScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
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

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)

    // Makes sure the child ComposeView is sticky with the current hosting view
    if (withHostingView) {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        if (child is ComposeView) {
          val offsetX = paddingLeft
          val offsetY = paddingRight
          child.layout(offsetX, offsetY, offsetX + width, offsetY + height)
        }
      }
    }
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

/**
 * A composable DSL scope that wraps an [ExpoComposeView] to provide syntax sugar.
 *
 * This scope allows defining view content using a functional, DSL-style API
 * without creating a dedicated subclass of [ExpoComposeView].
 */
class FunctionalComposableScope(
  val view: ComposeFunctionHolder<*>,
  val composableScope: ComposableScope
) {
  val appContext = view.appContext

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

  /**
   * Registers an imperative handler that can be called from AsyncFunction via delegate().
   *
   * Usage:
   * ```
   * // In composable:
   * ImperativeHandler(TextInputFunctions.SET_TEXT) { text: String ->
   *   textState.value = text
   * }
   *
   * // In ExpoUIModule functions block:
   * AsyncFunction(TextInputFunctions.SET_TEXT) { text: String ->
   *   delegate(text)
   * }
   * ```
   */
  inline fun <reified P0> ImperativeHandler(
    name: String,
    noinline handler: (P0) -> Unit
  ) {
    view.imperativeHandlers[name] = { args ->
      @Suppress("UNCHECKED_CAST")
      handler(args[0] as P0)
    }
  }

  /**
   * Registers an imperative handler with 2 parameters.
   */
  inline fun <reified P0, reified P1> ImperativeHandler(
    name: String,
    noinline handler: (P0, P1) -> Unit
  ) {
    view.imperativeHandlers[name] = { args ->
      @Suppress("UNCHECKED_CAST")
      handler(args[0] as P0, args[1] as P1)
    }
  }

  /**
   * Registers an imperative handler with 3 parameters.
   */
  inline fun <reified P0, reified P1, reified P2> ImperativeHandler(
    name: String,
    noinline handler: (P0, P1, P2) -> Unit
  ) {
    view.imperativeHandlers[name] = { args ->
      @Suppress("UNCHECKED_CAST")
      handler(args[0] as P0, args[1] as P1, args[2] as P2)
    }
  }

  /**
   * Registers an imperative handler with no parameters.
   */
  fun ImperativeHandler(
    name: String,
    handler: () -> Unit
  ) {
    view.imperativeHandlers[name] = { handler() }
  }
}

@SuppressLint("ViewConstructor")
class ComposeFunctionHolder<Props : ComposeProps>(
  context: Context,
  appContext: AppContext,
  override val name: String,
  private val composableContent: @Composable FunctionalComposableScope.(props: Props) -> Unit,
  override val props: Props
) : ExpoComposeView<Props>(context, appContext), ViewFunctionHolder {
  val propsMutableState = mutableStateOf(props)

  /**
   * Map of imperative function handlers registered by composables via [ImperativeHandler].
   * Key is the function name, value is the handler.
   */
  @PublishedApi
  internal val imperativeHandlers = mutableMapOf<String, (Array<out Any?>) -> Any?>()

  /**
   * Calls an imperative function handler registered by the composable.
   * Called by AsyncFunction implementations via [AsyncFunctionScope.delegate].
   */
  fun callImperative(name: String, vararg args: Any?): Any? {
    val handler = imperativeHandlers[name]
      ?: throw IllegalStateException("No imperative handler registered for '$name'. Make sure to use 'ImperativeHandler(\"$name\") { ... }' in your composable.")
    return handler(args)
  }

  @Composable
  override fun ComposableScope.Content() {
    val props by propsMutableState
    with(FunctionalComposableScope(this@ComposeFunctionHolder, this@Content)) {
      composableContent(props)
    }
  }
}

/**
 * Scope for AsyncFunction lambdas that provides access to call the imperative handler.
 * The function name is captured from the AsyncFunction definition.
 *
 * Usage:
 * ```
 * AsyncFunction("setText") { text: String ->
 *   callImperativeHandler(text)
 * }
 * ```
 */
class AsyncFunctionScope<Props : ComposeProps>(
  val view: ComposeFunctionHolder<Props>,
  @PublishedApi internal val functionName: String
) {
  /**
   * Calls the [ImperativeHandler] registered by the composable.
   * The handler name is automatically derived from the AsyncFunction name.
   */
  fun callImperativeHandler(vararg args: Any?): Any? {
    return view.callImperative(functionName, *args)
  }
}
