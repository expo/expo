package host.exp.exponent.home

import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.rememberCoroutineScope
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

    // We use a LaunchedEffect that will re-run if any of its keys change.
    LaunchedEffect(listState.layoutInfo, isFetching, canLoadMore) {
        // Do not trigger load if we are already fetching or if there are no more items
        if (isFetching || !canLoadMore) {
            return@LaunchedEffect
        }

        val visibleItemsInfo = listState.layoutInfo.visibleItemsInfo
        // Do not trigger if the list is empty, as there's nothing to scroll.
        if (visibleItemsInfo.isEmpty()) {
            scope.launch {
                onLoadMore()
            }
            return@LaunchedEffect
        }

        // Check if the last visible item is close to the end of the list
        val lastVisibleItem = visibleItemsInfo.last()
        val totalItemCount = listState.layoutInfo.totalItemsCount

        if (lastVisibleItem.index >= totalItemCount - 1 - buffer) {
            // Launch the load more function in the provided scope
            scope.launch {
                onLoadMore()
            }
        }
    }
}