package expo.modules.kotlin.views

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.RecomposeScope
import androidx.compose.runtime.currentRecomposeScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.viewevent.CoalescingKey
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.viewevent.ViewEvent
import expo.modules.kotlin.viewevent.ViewEventCallback
import expo.modules.kotlin.viewevent.ViewEventDelegate
import kotlin.reflect.KProperty

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

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (!withHostingView) {
      validateHostingAncestor()
    }
  }

  /**
   * Validates that this non-hosting Compose view has a valid Compose parent.
   *
   * This check is intentionally strict: the immediate parent must be an
   * [ExpoComposeView] or a [ComposeView]. Compose's composition context does not
   * propagate through arbitrary Android [ViewGroup]s, so inserting a plain RN
   * `View` (or any other non-Compose [ViewGroup]) between `<Host>` and this
   * component breaks the composition boundary — even though the ancestor chain
   * eventually reaches a `<Host>`. The fix is to make `<Host>` the direct parent.
   */
  private fun validateHostingAncestor() {
    val parentView = parent
    if (parentView is ExpoComposeView<*> || parentView is ComposeView) {
      return
    }
    val componentName = (this as? ViewFunctionHolder)?.name ?: this.javaClass.simpleName
    val exception = MissingHostException(componentName)
    Log.e("ExpoComposeView", "", exception)
    appContext.jsLogger?.error(exception.message ?: "Missing <Host>")
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
      it.addOnAttachStateChangeListener(
        OnAttachAfterDetachmentListener(onAttachAfterDetachment = {
          it.disposeComposition()
        })
      )
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

  //region Handle-based DSL (for View<Props> { Content { } } style)

  /**
   * Binds a handler for an async function declared via
   * [ComposeViewBuilderScope.AsyncFunction] (e.g. `val focus by AsyncFunction()`).
   * Call inside the `Content { props -> ... }` lambda. The handler is updated
   * on recomposition and cleaned up on disposal.
   *
   * For no-argument functions the lambda parameter is [Unit] and can be
   * ignored: `focus.handle { focusRequester.requestFocus() }`.
   */
  @SuppressLint("ComposableNaming")
  @Composable
  inline fun <reified P0> AsyncFunctionHandle<P0>.handle(noinline handler: suspend (P0) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args ->
        val arg = if (args.isEmpty()) Unit else args[0]
        enforceType<P0>(arg)
        currentHandler.value(arg)
      }
      onDispose { view.functionHandlers.remove(name) }
    }
  }

  @SuppressLint("ComposableNaming")
  @Composable
  inline fun <reified P0, reified P1> AsyncFunctionHandle2<P0, P1>.handle(noinline handler: suspend (P0, P1) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args ->
        val p0 = args[0]
        val p1 = args[1]
        enforceType<P0, P1>(p0, p1)
        currentHandler.value(p0, p1)
      }
      onDispose { view.functionHandlers.remove(name) }
    }
  }

  @SuppressLint("ComposableNaming")
  @Composable
  inline fun <reified P0, reified P1, reified P2> AsyncFunctionHandle3<P0, P1, P2>.handle(noinline handler: suspend (P0, P1, P2) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args ->
        val p0 = args[0]
        val p1 = args[1]
        val p2 = args[2]
        enforceType<P0, P1, P2>(p0, p1, p2)
        currentHandler.value(p0, p1, p2)
      }
      onDispose { view.functionHandlers.remove(name) }
    }
  }

  @SuppressLint("ComposableNaming")
  @Composable
  inline fun <reified P0, reified P1, reified P2, reified P3> AsyncFunctionHandle4<P0, P1, P2, P3>.handle(noinline handler: suspend (P0, P1, P2, P3) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args ->
        val p0 = args[0]
        val p1 = args[1]
        val p2 = args[2]
        val p3 = args[3]
        enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
        currentHandler.value(p0, p1, p2, p3)
      }
      onDispose { view.functionHandlers.remove(name) }
    }
  }

  @SuppressLint("ComposableNaming")
  @Composable
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunctionHandle5<P0, P1, P2, P3, P4>.handle(noinline handler: suspend (P0, P1, P2, P3, P4) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args ->
        val p0 = args[0]
        val p1 = args[1]
        val p2 = args[2]
        val p3 = args[3]
        val p4 = args[4]
        enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
        currentHandler.value(p0, p1, p2, p3, p4)
      }
      onDispose { view.functionHandlers.remove(name) }
    }
  }

  @SuppressLint("ComposableNaming")
  @Composable
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunctionHandle6<P0, P1, P2, P3, P4, P5>.handle(noinline handler: suspend (P0, P1, P2, P3, P4, P5) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args ->
        val p0 = args[0]
        val p1 = args[1]
        val p2 = args[2]
        val p3 = args[3]
        val p4 = args[4]
        val p5 = args[5]
        enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
        currentHandler.value(p0, p1, p2, p3, p4, p5)
      }
      onDispose { view.functionHandlers.remove(name) }
    }
  }

  @SuppressLint("ComposableNaming")
  @Composable
  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunctionHandle7<P0, P1, P2, P3, P4, P5, P6>.handle(noinline handler: suspend (P0, P1, P2, P3, P4, P5, P6) -> Any?) {
    val currentHandler = rememberUpdatedState(handler)
    DisposableEffect(name) {
      view.functionHandlers[name] = { args ->
        val p0 = args[0]
        val p1 = args[1]
        val p2 = args[2]
        val p3 = args[3]
        val p4 = args[4]
        val p5 = args[5]
        val p6 = args[6]
        enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
        currentHandler.value(p0, p1, p2, p3, p4, p5, p6)
      }
      onDispose { view.functionHandlers.remove(name) }
    }
  }

  /**
   * Dispatches an event declared via [ComposeViewBuilderScope.Event]
   * (e.g. `val onValueChange by Event<String>()`).
   * Callable anywhere the [FunctionalComposableScope] is in scope, including
   * event-callback lambdas inside the `Content { }` block.
   */
  operator fun <T> EventHandle<T>.invoke(payload: T) {
    view.getOrCreateEventCallback(name, coalescingKey).invoke(payload)
  }

  //endregion Handle-based DSL
}

//region Handle types — lightweight name carriers produced by ComposeViewBuilderScope delegates

/**
 * A handle for an async function declared with
 * [ComposeViewBuilderScope.AsyncFunction] (0- or 1-argument variant).
 * The handle carries only the function name; bind a handler inside the
 * `Content { }` block via [FunctionalComposableScope.handle].
 */
class AsyncFunctionHandle<P0> @PublishedApi internal constructor(
  @PublishedApi internal val name: String
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): AsyncFunctionHandle<P0> = this
}

class AsyncFunctionHandle2<P0, P1> @PublishedApi internal constructor(
  @PublishedApi internal val name: String
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): AsyncFunctionHandle2<P0, P1> = this
}

class AsyncFunctionHandle3<P0, P1, P2> @PublishedApi internal constructor(
  @PublishedApi internal val name: String
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): AsyncFunctionHandle3<P0, P1, P2> = this
}

class AsyncFunctionHandle4<P0, P1, P2, P3> @PublishedApi internal constructor(
  @PublishedApi internal val name: String
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): AsyncFunctionHandle4<P0, P1, P2, P3> = this
}

class AsyncFunctionHandle5<P0, P1, P2, P3, P4> @PublishedApi internal constructor(
  @PublishedApi internal val name: String
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): AsyncFunctionHandle5<P0, P1, P2, P3, P4> = this
}

class AsyncFunctionHandle6<P0, P1, P2, P3, P4, P5> @PublishedApi internal constructor(
  @PublishedApi internal val name: String
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): AsyncFunctionHandle6<P0, P1, P2, P3, P4, P5> = this
}

class AsyncFunctionHandle7<P0, P1, P2, P3, P4, P5, P6> @PublishedApi internal constructor(
  @PublishedApi internal val name: String
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): AsyncFunctionHandle7<P0, P1, P2, P3, P4, P5, P6> = this
}

/**
 * A handle for an event declared with [ComposeViewBuilderScope.Event]
 * (e.g. `val onValueChange by Event<String>()`). Dispatch by invoking
 * the handle directly: `onValueChange(payload)`.
 */
class EventHandle<T> @PublishedApi internal constructor(
  @PublishedApi internal val name: String,
  @PublishedApi internal val coalescingKey: CoalescingKey<T>?
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): EventHandle<T> = this
}

//endregion Handle types

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

  /**
   * Per-instance cache of [ViewEventCallback]s keyed by event name. Populated
   * lazily by [getOrCreateEventCallback] to avoid re-creating [ViewEvent]
   * (and repeating its one-time validation) on every dispatch from an
   * [EventHandle] inside a composable body.
   */
  @PublishedApi
  internal val eventCallbacks = mutableMapOf<String, ViewEventCallback<*>>()

  @PublishedApi
  @Suppress("UNCHECKED_CAST")
  internal fun <T> getOrCreateEventCallback(
    name: String,
    coalescingKey: CoalescingKey<T>?
  ): ViewEventCallback<T> {
    return eventCallbacks.getOrPut(name) {
      ViewEvent<T>(name, this, coalescingKey)
    } as ViewEventCallback<T>
  }

  @Composable
  override fun ComposableScope.Content() {
    val props by propsMutableState
    with(FunctionalComposableScope(this@ComposeFunctionHolder, this@Content)) {
      composableContent(props)
    }
  }
}

internal class MissingHostException(componentName: String) :
  CodedException(
    "A Jetpack Compose view \"$componentName\" must be rendered as a direct child of a <Host> component. " +
      "Wrap your component with `<Host>` from '@expo/ui/jetpack-compose'. " +
      "Note that inserting another `<View>` (or any non-Compose ViewGroup) between `<Host>` and this " +
      "component breaks the Compose composition boundary and will still trigger this error."
  )
