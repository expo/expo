package host.exp.exponent.apollo

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class CursorPage<Data>(
  val items: List<Data>,
  val hasNextPage: Boolean,
  val endCursor: String?
)

typealias CursorQuery<T> = suspend (first: Int, after: String?) -> CursorPage<T>

class CursorPaginator<Data>(
  private val defaultLimit: Int = 15,
  private val fetch: CursorQuery<Data>
) {
  private val _data = MutableStateFlow<List<Data>>(emptyList())
  val data: StateFlow<List<Data>> = _data.asStateFlow()

  private val _isLastPage = MutableStateFlow(false)
  val isLastPage: StateFlow<Boolean> = _isLastPage.asStateFlow()

  private val _isFetching = MutableStateFlow(false)
  val isFetching: StateFlow<Boolean> = _isFetching.asStateFlow()

  private var endCursor: String? = null

  suspend fun loadMore() {
    if (_isFetching.value || _isLastPage.value) {
      return
    }

    _isFetching.value = true
    val page = fetch(defaultLimit, endCursor)

    endCursor = page.endCursor
    _isLastPage.value = !page.hasNextPage
    _data.update { oldData -> oldData + page.items }
    _isFetching.value = false
  }
}
