package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.MutableIntState
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class LazyItemsProps(
  val itemKeys: MutableState<List<String>> = mutableStateOf(emptyList()),
  val revision: MutableState<Int> = mutableStateOf(0),
  val estimatedItemSize: MutableState<Double> = mutableStateOf(64.0)
) : ComposeProps

internal data class WindowChangeEvent(
  @Field val first: Int,
  @Field val last: Int,
  @Field val revision: Int
) : Record

/**
 * A block of recycled items inside [LazyColumnView] or [LazyRowView]. It renders no content of its
 * own: [lazyRecycledItems] expands it into one lazy item per key, each backed by a slot of its
 * pool child.
 */
@SuppressLint("ViewConstructor")
class LazyItemsView(context: Context, appContext: AppContext) :
  ExpoComposeView<LazyItemsProps>(context, appContext) {
  override val props = LazyItemsProps()
  private val onWindowChange by EventDispatcher<WindowChangeEvent>()

  internal val pool: MutableState<LazyItemsPoolView?> = mutableStateOf(null)
  internal val window = LazyItemsWindow { first, last, revision ->
    onWindowChange(WindowChangeEvent(first, last, revision))
  }

  override fun onViewAdded(child: View?) {
    super.onViewAdded(child)
    pool.value = findChildOfType<LazyItemsPoolView>(this)
  }

  override fun onViewRemoved(child: View?) {
    super.onViewRemoved(child)
    pool.value = findChildOfType<LazyItemsPoolView>(this)
  }

  internal fun cancelPendingWindowChange() {
    window.cancel()
  }

  @Composable
  override fun ComposableScope.Content() = Unit
}

@OptimizedComposeProps
class LazyItemsPoolProps : ComposeProps

/**
 * Holds the recycled slots, so mounting a slot never republishes the props of [LazyItemsView].
 */
@SuppressLint("ViewConstructor")
class LazyItemsPoolView(context: Context, appContext: AppContext) :
  ExpoComposeView<LazyItemsPoolProps>(context, appContext) {
  override val props = LazyItemsPoolProps()

  internal val slotCount: MutableIntState = mutableIntStateOf(0)

  override fun onViewAdded(child: View?) {
    super.onViewAdded(child)
    slotCount.intValue = childCount
  }

  override fun onViewRemoved(child: View?) {
    super.onViewRemoved(child)
    slotCount.intValue = childCount
  }

  @Composable
  override fun ComposableScope.Content() = Unit
}

@OptimizedComposeProps
data class LazyItemsSlotProps(
  val itemKey: MutableState<String> = mutableStateOf(""),
  val index: MutableState<Int> = mutableStateOf(0),
  val revision: MutableState<Int> = mutableStateOf(0)
) : ComposeProps

/**
 * One recycled slot. JS assigns item `index` to slot `index % slotCount` and republishes these
 * props when the slot moves to another item.
 */
@SuppressLint("ViewConstructor")
class LazyItemsSlotView(context: Context, appContext: AppContext) :
  ExpoComposeView<LazyItemsSlotProps>(context, appContext) {
  override val props = LazyItemsSlotProps()

  @Composable
  override fun ComposableScope.Content() {
    Children(this)
  }
}

/**
 * Expands a [LazyItemsView] child into one lazy item per key. An item composes its slot only while
 * the slot still carries that item, and shows a placeholder of the measured or estimated size
 * while JS moves the slot over.
 */
internal fun LazyListScope.lazyRecycledItems(
  view: LazyItemsView,
  scope: ComposableScope,
  isVertical: Boolean
) {
  val keys = view.props.itemKeys.value
  val revision = view.props.revision.value
  val estimatedItemSize = view.props.estimatedItemSize.value
  if (keys.isEmpty()) {
    return
  }
  val window = view.window
  items(count = keys.size, key = { keys[it] }) { index ->
    val itemKey = keys[index]
    val token = remember(itemKey, index, revision) { Any() }
    DisposableEffect(token) {
      window.appear(itemKey, index, token, revision, keys)
      onDispose { window.disappear(itemKey, token) }
    }

    val pool = view.pool.value
    val slotCount = pool?.slotCount?.intValue ?: 0
    val slot = if (pool != null && slotCount > 0) {
      pool.getChildAt(index % slotCount) as? LazyItemsSlotView
    } else {
      null
    }
    // A slot carries this item only until JS moves it to another one.
    val content = slot?.takeIf {
      it.props.itemKey.value == itemKey &&
        it.props.index.value == index &&
        it.props.revision.value == revision
    }

    val density = LocalDensity.current
    val placeholderSize = with(density) {
      window.size(itemKey, estimatedItemSize.dp.roundToPx()).toDp()
    }
    Box(
      modifier = (if (isVertical) Modifier.fillMaxWidth() else Modifier)
        .onSizeChanged { size ->
          // Only the vertical layout stretches an item across the list, so only it can read the
          // list size from one.
          if (isVertical) {
            window.updateCrossAxisSize(size.width)
          }
          if (content != null) {
            window.measure(itemKey, if (isVertical) size.height else size.width, revision)
          }
        }
    ) {
      if (content != null) {
        with(scope) {
          with(content) {
            Content()
          }
        }
      } else {
        Spacer(
          modifier = if (isVertical) {
            Modifier.fillMaxWidth().height(placeholderSize)
          } else {
            Modifier.fillMaxHeight().width(placeholderSize)
          }
        )
      }
    }
  }
}

/**
 * Tracks the live items without triggering recomposition, and batches window requests to JS.
 */
internal class LazyItemsWindow(
  private val send: (first: Int, last: Int, revision: Int) -> Unit
) {
  private val handler = Handler(Looper.getMainLooper())
  private val appeared = mutableMapOf<String, Int>()
  private val tokens = mutableMapOf<String, Any>()
  private val sizes = mutableMapOf<String, Int>()
  private var crossAxisSize = 0
  private var revision = -1
  private var pending = false
  private var lastSent: Triple<Int, Int, Int>? = null

  fun appear(key: String, index: Int, token: Any, revision: Int, keys: List<String>) {
    reset(revision, keys)
    if (index !in keys.indices || keys[index] != key) {
      return
    }
    appeared[key] = index
    tokens[key] = token
    schedule()
  }

  fun disappear(key: String, token: Any) {
    // Ignore callbacks from an item that has been replaced.
    if (tokens[key] !== token) {
      return
    }
    appeared.remove(key)
    tokens.remove(key)
    if (appeared.isEmpty()) {
      lastSent = null
    }
    schedule()
  }

  fun size(key: String, fallback: Int): Int = sizes[key] ?: fallback

  fun measure(key: String, size: Int, revision: Int) {
    if (revision != this.revision || size <= 0) {
      return
    }
    sizes[key] = size
  }

  fun updateCrossAxisSize(size: Int) {
    if (size == crossAxisSize) {
      return
    }
    if (crossAxisSize > 0) {
      sizes.clear()
    }
    crossAxisSize = size
  }

  fun cancel() {
    handler.removeCallbacksAndMessages(null)
    pending = false
  }

  private fun reset(newRevision: Int, keys: List<String>) {
    if (revision == newRevision) {
      return
    }
    revision = newRevision
    sizes.clear()
    val positions = HashMap<String, Int>(keys.size)
    keys.forEachIndexed { index, key -> positions[key] = index }
    val kept = appeared.keys.mapNotNull { key -> positions[key]?.let { key to it } }
    appeared.clear()
    appeared.putAll(kept)
    tokens.keys.retainAll { positions.containsKey(it) }
    lastSent = null
    schedule()
  }

  private fun schedule() {
    if (pending) {
      return
    }
    pending = true
    handler.post {
      pending = false
      val first = appeared.values.minOrNull() ?: return@post
      val last = appeared.values.maxOrNull() ?: return@post
      val event = Triple(first, last, revision)
      if (event == lastSent) {
        return@post
      }
      lastSent = event
      send(first, last, revision)
    }
  }
}
