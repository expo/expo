package expo.modules.ui

import android.view.View
import android.view.ViewGroup
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

@OptimizedRecord
data class HorizontalPagerCurrentPageChangeEvent(
  @Field val position: Int = 0
) : Record

@OptimizedRecord
data class HorizontalPagerSettledPageChangeEvent(
  @Field val position: Int = 0
) : Record

@OptimizedComposeProps
data class HorizontalPagerProps(
  val initialPage: Int = 0,
  val pageSpacing: Float = 0f,
  val contentPadding: Either<Float, PaddingValuesRecord>? = null,
  val userScrollEnabled: Boolean = true,
  val reverseLayout: Boolean = false,
  val beyondViewportPageCount: Int = 0,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.HorizontalPagerContent(
  props: HorizontalPagerProps,
  animateScrollToPage: AsyncFunctionHandle<Int>,
  scrollToPage: AsyncFunctionHandle<Int>,
  onCurrentPageChange: (HorizontalPagerCurrentPageChangeEvent) -> Unit,
  onSettledPageChange: (HorizontalPagerSettledPageChangeEvent) -> Unit
) {
  // Mirror view.size into snapshot state so the outer scope recomposes when
  // children are added/removed. Without this, Compose's pager caches its
  // LazyLayout interval list (built via derivedStateOf around state.pageCount)
  // and crashes on scroll past the last index it knew about, because reading
  // view.size — a plain Java property — registers no snapshot dependency.
  val pageCountState = remember { mutableIntStateOf(view.size) }
  DisposableEffect(view) {
    view.setOnHierarchyChangeListener(object : ViewGroup.OnHierarchyChangeListener {
      override fun onChildViewAdded(parent: View?, child: View?) { pageCountState.intValue = view.size }
      override fun onChildViewRemoved(parent: View?, child: View?) { pageCountState.intValue = view.size }
    })
    pageCountState.intValue = view.size
    onDispose { view.setOnHierarchyChangeListener(null) }
  }

  val pageCount = pageCountState.intValue
  if (pageCount == 0) return
  val pagerState = rememberPagerState(
    initialPage = props.initialPage.coerceIn(0, pageCount - 1)
  ) { pageCountState.intValue }
  val scope = rememberCoroutineScope()

  // Dispatch into the composition's scope so the scroll runs with Compose's
  // MonotonicFrameClock; .join() lets the JS-side promise await completion.
  animateScrollToPage.handle { page ->
    scope.launch { pagerState.animateScrollToPage(page) }.join()
  }

  scrollToPage.handle { page ->
    scope.launch { pagerState.scrollToPage(page) }.join()
  }

  // Mirror Compose's PagerState observable fields to JS callbacks. Drop the
  // first emission so we don't echo the initial value back on mount.
  LaunchedEffect(pagerState) {
    snapshotFlow { pagerState.currentPage }
      .drop(1)
      .collect { onCurrentPageChange(HorizontalPagerCurrentPageChangeEvent(it)) }
  }

  LaunchedEffect(pagerState) {
    snapshotFlow { pagerState.settledPage }
      .drop(1)
      .collect { onSettledPageChange(HorizontalPagerSettledPageChangeEvent(it)) }
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
