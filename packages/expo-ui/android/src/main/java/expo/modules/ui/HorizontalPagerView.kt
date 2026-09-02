package expo.modules.ui

import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.interaction.DragInteraction
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.launch
import androidx.compose.ui.unit.dp
import androidx.core.view.size
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.state.WorkletCallback

@OptimizedRecord
data class HorizontalPagerCurrentPageChangeEvent(
  @Field val position: Int = 0
) : Record

@OptimizedRecord
data class HorizontalPagerSettledPageChangeEvent(
  @Field val position: Int = 0
) : Record

@OptimizedRecord
data class HorizontalPagerPageScrollEvent(
  @Field val currentPage: Int = 0,
  @Field val currentPageOffsetFraction: Float = 0f
) : Record

@OptimizedRecord
data class HorizontalPagerScrollInProgressChangeEvent(
  @Field val isScrollInProgress: Boolean = false
) : Record

@OptimizedRecord
data class HorizontalPagerDragInteractionEvent(
  @Field val kind: String = "start"
) : Record

@OptimizedComposeProps
data class HorizontalPagerProps(
  val initialPage: Int = 0,
  val pageSpacing: Float = 0f,
  val contentPadding: Either<Float, PaddingValuesRecord>? = null,
  val userScrollEnabled: Boolean = true,
  val reverseLayout: Boolean = false,
  val beyondViewportPageCount: Int = 0,
  val onPageScrollSync: WorkletCallback? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.HorizontalPagerContent(
  props: HorizontalPagerProps,
  animateScrollToPage: AsyncFunctionHandle<Int>,
  scrollToPage: AsyncFunctionHandle<Int>,
  onCurrentPageChange: (HorizontalPagerCurrentPageChangeEvent) -> Unit,
  onSettledPageChange: (HorizontalPagerSettledPageChangeEvent) -> Unit,
  onPageScroll: (HorizontalPagerPageScrollEvent) -> Unit,
  onScrollInProgressChange: (HorizontalPagerScrollInProgressChangeEvent) -> Unit,
  onDragInteraction: (HorizontalPagerDragInteractionEvent) -> Unit
) {
  // Mirror view.size into snapshot state so the outer scope recomposes when
  // children are added/removed. Without this, Compose's pager caches its
  // LazyLayout interval list (built via derivedStateOf around state.pageCount)
  // and crashes on scroll past the last index it knew about, because reading
  // view.size — a plain Java property — registers no snapshot dependency.
  val pageCountState = remember { mutableIntStateOf(view.size) }
  // Assumes sole ownership of `view`'s OnHierarchyChangeListener — there is
  // only one slot per ViewGroup, and `onDispose` resets it to null. Safe
  // because `view` is the expo Host's private container.
  DisposableEffect(view) {
    view.setOnHierarchyChangeListener(object : ViewGroup.OnHierarchyChangeListener {
      override fun onChildViewAdded(parent: View?, child: View?) {
        pageCountState.intValue = view.size
      }
      override fun onChildViewRemoved(parent: View?, child: View?) {
        pageCountState.intValue = view.size
      }
    })
    pageCountState.intValue = view.size
    onDispose { view.setOnHierarchyChangeListener(null) }
  }

  // Register the imperative handles before the empty-children early return, so
  // in case there ever are JS calls dispatched while `view.size` is still 0, they bind to a handler.
  // `coerceAtLeast(0)` guards against `coerceIn(0, -1)` throwing in that gap.
  val pagerState = rememberPagerState(
    initialPage = props.initialPage.coerceAtLeast(0)
  ) { pageCountState.intValue }
  val scope = rememberCoroutineScope()

  // Dispatch into the composition's scope so the scroll runs with Compose's
  // MonotonicFrameClock; .join() lets the JS-side promise await completion.
  // Clamp page indices here because Compose throws on out-of-range values.
  animateScrollToPage.handle { page ->
    val count = pageCountState.intValue
    if (count > 0) {
      val clamped = page.coerceIn(0, count - 1)
      scope.launch { pagerState.animateScrollToPage(clamped) }.join()
    }
  }

  scrollToPage.handle { page ->
    val count = pageCountState.intValue
    if (count > 0) {
      val clamped = page.coerceIn(0, count - 1)
      scope.launch { pagerState.scrollToPage(clamped) }.join()
    }
  }

  val pageCount = pageCountState.intValue
  if (pageCount == 0) return

  // Mirror Compose's PagerState observable fields to JS callbacks. Each
  // state-backed snapshotFlow drops its first emission so we don't echo the
  // initial value back on mount; the interactionSource flow doesn't drop
  // because its emissions are discrete events, not state values.
  LaunchedEffect(pagerState) {
    launch {
      snapshotFlow { pagerState.currentPage }
        .drop(1)
        .collect { onCurrentPageChange(HorizontalPagerCurrentPageChangeEvent(it)) }
    }
    launch {
      snapshotFlow { pagerState.settledPage }
        .drop(1)
        .collect { onSettledPageChange(HorizontalPagerSettledPageChangeEvent(it)) }
    }
    launch {
      snapshotFlow {
        pagerState.currentPage to pagerState.currentPageOffsetFraction
      }
        .drop(1)
        .collect { (currentPage, fraction) ->
          // Mutually exclusive: the JS wrapper only wires one path at a time.
          // Skipping the regular event when a worklet is attached avoids the
          // per-frame Record allocation + async JS-thread event dispatch.
          val sync = props.onPageScrollSync
          if (sync != null) {
            sync.invoke(currentPage, fraction)
          } else {
            onPageScroll(
              HorizontalPagerPageScrollEvent(
                currentPage = currentPage,
                currentPageOffsetFraction = fraction
              )
            )
          }
        }
    }
    launch {
      snapshotFlow { pagerState.isScrollInProgress }
        .drop(1)
        .collect {
          onScrollInProgressChange(HorizontalPagerScrollInProgressChangeEvent(isScrollInProgress = it))
        }
    }
    launch {
      pagerState.interactionSource.interactions.collect { interaction ->
        val kind = when (interaction) {
          is DragInteraction.Start -> "start"
          is DragInteraction.Stop -> "stop"
          is DragInteraction.Cancel -> "cancel"
          else -> return@collect
        }
        onDragInteraction(HorizontalPagerDragInteractionEvent(kind = kind))
      }
    }
  }

  val contentPadding = props.contentPadding.toPaddingValues()

  HorizontalPager(
    state = pagerState,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    contentPadding = contentPadding,
    pageSpacing = props.pageSpacing.dp,
    userScrollEnabled = props.userScrollEnabled,
    reverseLayout = props.reverseLayout,
    beyondViewportPageCount = props.beyondViewportPageCount
  ) { pageIndex ->
    Child(UIComposableScope(), pageIndex)
  }
}
