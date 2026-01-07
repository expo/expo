package host.exp.exponent.apollo

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

typealias Query<T> = suspend (limit: Int, offset: Int) -> List<T>

class Paginator<Data>(
  private val defaultLimit: Int = 15,
  private val fetch: Query<Data>
) {
  private val _data = MutableStateFlow<List<Data>>(emptyList())

  val data: StateFlow<List<Data>> = _data.asStateFlow()
  private var currentOffset = 0

  var isLastPage = false
    private set
  var isFetching = false
    private set

  suspend fun loadMore() {
    if (isFetching || isLastPage) {
      return
    }

    isFetching = true
    val data = fetch(defaultLimit, currentOffset)
    currentOffset += data.size

    if (data.size < defaultLimit || data.isEmpty()) {
      isLastPage = true
    }

    currentOffset += data.size
    _data.update { oldData -> oldData + data }
    isFetching = false
  }
}
