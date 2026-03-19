package expo.modules.kotlin.views

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.RecomposeScope
import androidx.compose.runtime.currentRecomposeScope
import androidx.compose.runtime.key
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.CoalescingKey
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.viewevent.ViewEvent
import expo.modules.kotlin.viewevent.ViewEventDelegate

/**
 * A scope interface passed through the compose view hierarchy.
 * Downstream packages (e.g. expo-ui) can implement this interface
 * to provide strongly-typed layout and context properties.
 */
interface ComposableScope

private object EmptyComposableScope : ComposableScope

fun ComposableScope(): ComposableScope = EmptyComposableScope

inline fun <T : ComposableScope> T.withIf(
  condition: Boolean,
  block: T.() -> T
): T {
  return if (condition) block() else this
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
  protected var recomposeScope: RecomposeScope? = null

  private val globalEvent = ViewEvent<Pair<String, Map<String, Any?>>>(GLOBAL_EVENT_NAME, this, null)

  /**
   * A global event dispatcher
   */
  val globalEventDispatcher: (String, Map<String, Any?>) -> Unit = { name, params ->
    globalEvent.invoke(Pair(name, params))
  }

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
    recomposeScope = currentRecomposeScope
    for (index in 0..<this.size) {
      val child = getChildAt(index) as? ExpoComposeView<*> ?: continue
      key(child) {
        with(composableScope ?: ComposableScope()) {
          with(child) {
            Content()
          }
        }
      }
    }
  }

  @Composable
  fun Children(composableScope: ComposableScope?, filter: (child: ExpoComposeView<*>) -> Boolean) {
    recomposeScope = currentRecomposeScope
    for (index in 0..<this.size) {
      val child = getChildAt(index) as? ExpoComposeView<*> ?: continue
      if (!filter(child)) {
        continue
      }
      key(child) {
        with(composableScope ?: ComposableScope()) {
          with(child) {
            Content()
          }
        }
      }
    }
  }

  @Composable
  fun Child(composableScope: ComposableScope, index: Int) {
    recomposeScope = currentRecomposeScope
    val child = getChildAt(index) as? ExpoComposeView<*> ?: return
    key(child) {
      with(composableScope) {
        with(child) {
          Content()
        }
      }
    }
  }

  @Composable
  fun Child(index: Int) {
    Child(ComposableScope(), index)
  }

  init {
    if (withHostingView) {
      clipChildren = false
      clipToPadding = false
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
    val view = if (child !is ExpoComposeView<*> && child !is ComposeView && this !is RNHostViewInterface) {
      ExpoComposeAndroidView(child, appContext)
    } else {
      child
    }
    super.addView(view, index, params)
  }

  override fun onViewAdded(child: View?) {
    super.onViewAdded(child)
    recomposeScope?.invalidate()
  }

  override fun onViewRemoved(child: View?) {
    super.onViewRemoved(child)
    recomposeScope?.invalidate()
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
  val globalEventDispatcher = view.globalEventDispatcher

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

  @Composable
  fun Children(composableScope: ComposableScope?, filter: (child: ExpoComposeView<*>) -> Boolean) {
    view.Children(composableScope, filter)
  }

  inline fun <reified T> EventDispatcher(noinline coalescingKey: CoalescingKey<T>? = null): ViewEventDelegate<T> {
    return view.EventDispatcher<T>(coalescingKey)
  }

  /**
   * Creates a [AsyncFunctionHandlerScope] for a function declared with
   * [ComposeViewFunctionDefinitionBuilder.Function].
   * The returned scope can be passed to child composables, which call it with
   * a handler lambda that has access to local compose state.
   *
   * This is the counterpart to [EventDispatcher] — events push data to JS,
   * while function handlers receive calls from JS.
   *
   * Usage in the ExpoUIView composable:
   * ```
   * val onHide = AsyncFunctionHandler("hide")
   * ModalBottomSheetContent(props, onHide) { ... }
   * ```
   * Usage in the content composable:
   * ```
   * onHide { sheetState.hide() }
   * ```
   */
  fun AsyncFunctionHandler(name: String): AsyncFunctionHandlerScope<Unit> {
    return AsyncFunctionHandlerScope(name, view)
  }

  @JvmName("AsyncFunctionHandler1")
  fun <P0> AsyncFunctionHandler(name: String): AsyncFunctionHandlerScope<P0> {
    return AsyncFunctionHandlerScope(name, view)
  }

  @JvmName("AsyncFunctionHandler2")
  fun <P0, P1> AsyncFunctionHandler(name: String): AsyncFunctionHandlerScope2<P0, P1> {
    return AsyncFunctionHandlerScope2(name, view)
  }

  @JvmName("AsyncFunctionHandler3")
  fun <P0, P1, P2> AsyncFunctionHandler(name: String): AsyncFunctionHandlerScope3<P0, P1, P2> {
    return AsyncFunctionHandlerScope3(name, view)
  }

  @JvmName("AsyncFunctionHandler4")
  fun <P0, P1, P2, P3> AsyncFunctionHandler(name: String): AsyncFunctionHandlerScope4<P0, P1, P2, P3> {
    return AsyncFunctionHandlerScope4(name, view)
  }

  @JvmName("AsyncFunctionHandler5")
  fun <P0, P1, P2, P3, P4> AsyncFunctionHandler(name: String): AsyncFunctionHandlerScope5<P0, P1, P2, P3, P4> {
    return AsyncFunctionHandlerScope5(name, view)
  }

  @JvmName("AsyncFunctionHandler6")
  fun <P0, P1, P2, P3, P4, P5> AsyncFunctionHandler(name: String): AsyncFunctionHandlerScope6<P0, P1, P2, P3, P4, P5> {
    return AsyncFunctionHandlerScope6(name, view)
  }

  @JvmName("AsyncFunctionHandler7")
  fun <P0, P1, P2, P3, P4, P5, P6> AsyncFunctionHandler(name: String): AsyncFunctionHandlerScope7<P0, P1, P2, P3, P4, P5, P6> {
    return AsyncFunctionHandlerScope7(name, view)
  }
}

/**
 * Scope objects returned by [FunctionalComposableScope.AsyncFunctionHandler].
 * Call [invoke] with a typed suspend lambda to register the handler.
 * The handler is updated on recomposition and cleaned up on disposal.
 *
 * For no-argument functions (`AsyncFunctionHandlerScope<Unit>`), the lambda parameter
 * is `Unit` and can be ignored: `onHide { doStuff() }`.
 */
class AsyncFunctionHandlerScope<P0>(
  private val name: String,
  private val view: ComposeFunctionHolder<*>
) {
  @Suppress("UNCHECKED_CAST")
  @Composable
  operator fun invoke(handler: suspend (P0) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args ->
        val arg = if (args.isEmpty()) Unit as P0 else args[0] as P0
        currentHandler.value(arg)
      }
      onDispose { view.functionHandlers.remove(name) }
    }
  }
}

class AsyncFunctionHandlerScope2<P0, P1>(
  private val name: String,
  private val view: ComposeFunctionHolder<*>
) {
  @Suppress("UNCHECKED_CAST")
  @Composable
  operator fun invoke(handler: suspend (P0, P1) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args -> currentHandler.value(args[0] as P0, args[1] as P1) }
      onDispose { view.functionHandlers.remove(name) }
    }
  }
}

class AsyncFunctionHandlerScope3<P0, P1, P2>(
  private val name: String,
  private val view: ComposeFunctionHolder<*>
) {
  @Suppress("UNCHECKED_CAST")
  @Composable
  operator fun invoke(handler: suspend (P0, P1, P2) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args -> currentHandler.value(args[0] as P0, args[1] as P1, args[2] as P2) }
      onDispose { view.functionHandlers.remove(name) }
    }
  }
}

class AsyncFunctionHandlerScope4<P0, P1, P2, P3>(
  private val name: String,
  private val view: ComposeFunctionHolder<*>
) {
  @Suppress("UNCHECKED_CAST")
  @Composable
  operator fun invoke(handler: suspend (P0, P1, P2, P3) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args -> currentHandler.value(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3) }
      onDispose { view.functionHandlers.remove(name) }
    }
  }
}

class AsyncFunctionHandlerScope5<P0, P1, P2, P3, P4>(
  private val name: String,
  private val view: ComposeFunctionHolder<*>
) {
  @Suppress("UNCHECKED_CAST")
  @Composable
  operator fun invoke(handler: suspend (P0, P1, P2, P3, P4) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args -> currentHandler.value(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4) }
      onDispose { view.functionHandlers.remove(name) }
    }
  }
}

class AsyncFunctionHandlerScope6<P0, P1, P2, P3, P4, P5>(
  private val name: String,
  private val view: ComposeFunctionHolder<*>
) {
  @Suppress("UNCHECKED_CAST")
  @Composable
  operator fun invoke(handler: suspend (P0, P1, P2, P3, P4, P5) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args -> currentHandler.value(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5) }
      onDispose { view.functionHandlers.remove(name) }
    }
  }
}

class AsyncFunctionHandlerScope7<P0, P1, P2, P3, P4, P5, P6>(
  private val name: String,
  private val view: ComposeFunctionHolder<*>
) {
  @Suppress("UNCHECKED_CAST")
  @Composable
  operator fun invoke(handler: suspend (P0, P1, P2, P3, P4, P5, P6) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args -> currentHandler.value(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, args[6] as P6) }
      onDispose { view.functionHandlers.remove(name) }
    }
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

  @PublishedApi
  internal val functionHandlers = mutableMapOf<String, suspend (Array<out Any?>) -> Any?>()

  @Composable
  override fun ComposableScope.Content() {
    val props by propsMutableState
    with(FunctionalComposableScope(this@ComposeFunctionHolder, this@Content)) {
      composableContent(props)
    }
  }
}
