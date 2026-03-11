package host.exp.exponent.home

import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.launch

/**
 * A composable that handles the logic for infinite scrolling in a LazyColumn.
 * It observes the scroll state and triggers 'onLoadMore' when the user
 * scrolls near the end of the list.
 *
 * @param listState The state of the LazyColumn to observe.
 * @param buffer The number of items from the end of the list to start loading more.
 * @param isFetching Whether a fetch operation is currently in progress.
 * @param canLoadMore Whether there are more items to load.
 * @param onLoadMore The suspend function to call when more items should be loaded.
 */
@Composable
fun InfiniteListHandler(
  listState: LazyListState,
  buffer: Int = 3,
  isFetching: Boolean,
  canLoadMore: Boolean,
  onLoadMore: suspend () -> Unit
) {
  val scope = rememberCoroutineScope()
  LaunchedEffect(listState) {
    snapshotFlow {
      val layoutInfo = listState.layoutInfo
      val visibleItemsInfo = layoutInfo.visibleItemsInfo
      val totalItemCount = layoutInfo.totalItemsCount

      if (visibleItemsInfo.isEmpty()) {
        // List is empty, should trigger load
        true
      } else {
        // Check if the last visible item is close to the end
        val lastVisibleItem = visibleItemsInfo.last()
        lastVisibleItem.index >= totalItemCount - 1 - buffer
      }
    }.collect { shouldLoadMore ->
      if (shouldLoadMore && !isFetching && canLoadMore) {
        scope.launch {
          onLoadMore()
        }
      }
    }
  }
}
