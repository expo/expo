package host.exp.exponent.apollo

import android.util.Log
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

  // --- Start of Fix ---

  // 1. Expose isLastPage as a StateFlow
  private val _isLastPage = MutableStateFlow(false)
  val isLastPage: StateFlow<Boolean> = _isLastPage.asStateFlow()

  // 2. Expose isFetching as a StateFlow
  private val _isFetching = MutableStateFlow(false)
  val isFetching: StateFlow<Boolean> = _isFetching.asStateFlow()

  // --- End of Fix ---

  private var currentOffset = 0

  suspend fun loadMore() {
    // 3. Use the .value of the state flows for internal logic checks
    if (_isFetching.value || _isLastPage.value) {
      Log.d("Paginator", "Skipping loadMore: isFetching=${_isFetching.value}, isLastPage=${_isLastPage.value}")
      return
    }
    Log.d("Paginator", "Fetching data")

    // 4. Update the value of the StateFlows instead of the properties
    _isFetching.value = true
    val data = fetch(defaultLimit, currentOffset)
    Log.d("Paginator", "Fetched ${data.size} items at offset $currentOffset")

    currentOffset += data.size

    if (data.size < defaultLimit || data.isEmpty()) {
      _isLastPage.value = true
    }

    _data.update { oldData -> oldData + data }
    _isFetching.value = false
    Log.d("Paginator", "Updated data, isFetching=${_isFetching.value}, isLastPage=${_isLastPage.value}")
  }
}
