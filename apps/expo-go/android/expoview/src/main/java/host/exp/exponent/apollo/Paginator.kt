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

  private val _isLastPage = MutableStateFlow(false)
  val isLastPage: StateFlow<Boolean> = _isLastPage.asStateFlow()

  private val _isFetching = MutableStateFlow(false)
  val isFetching: StateFlow<Boolean> = _isFetching.asStateFlow()

  private var currentOffset = 0

  suspend fun loadMore() {
    if (_isFetching.value || _isLastPage.value) {
      return
    }

    _isFetching.value = true
    val data = fetch(defaultLimit, currentOffset)

    currentOffset += data.size

    if (data.size < defaultLimit || data.isEmpty()) {
      _isLastPage.value = true
    }

    _data.update { oldData -> oldData + data }
    _isFetching.value = false
  }
}
