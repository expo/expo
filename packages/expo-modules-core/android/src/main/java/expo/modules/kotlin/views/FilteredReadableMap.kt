package expo.modules.kotlin.views

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableMapKeySetIterator
import com.facebook.react.uimanager.ReactStylesDiffMap
import expo.modules.kotlin.Filter
import expo.modules.kotlin.exception.NullArgumentException

class FilteredReadableMapKeySetIterator(
  private val iterator: ReadableMapKeySetIterator,
  private val filter: Filter<String>
) : ReadableMapKeySetIterator {
  private var next: String? = null

  init {
    this.findNext()
  }

  override fun hasNextKey(): Boolean {
    return next != null
  }

  override fun nextKey(): String {
    val returnValue = next!!
    this.findNext()
    return returnValue
  }

  private fun findNext() {
    while (iterator.hasNextKey()) {
      val next = iterator.nextKey()
      this.next = next
      if (filter.apply(next)) {
        return
      }
    }
    next = null
  }
}

fun getFilteredReactStylesDiffMap(
  map: ReactStylesDiffMap?,
  filteredKeys: List<String>
) : ReactStylesDiffMap {
  val inputMap = map ?: throw NullArgumentException()
  val filteredKeySet = filteredKeys.toSet()
  val inputKeySet = inputMap.toMap().keys

  // if the keys are equal, return the input map - no need to perform the copy operation.
  if (inputKeySet == filteredKeySet) {
    return inputMap
  }

  val resultMap = Arguments.createMap()
  val iterator = inputMap.toMap().iterator()

  while (iterator.hasNext()) {
    val (key, value) = iterator.next()
    if (key in filteredKeySet) {
      when (value) {
        is Boolean -> resultMap.putBoolean(key, value)
        is Int -> resultMap.putInt(key, value)
        is Double -> resultMap.putDouble(key, value)
        is String -> resultMap.putString(key, value)
        is ReadableMap -> resultMap.putMap(key, value)
        is com.facebook.react.bridge.ReadableArray -> resultMap.putArray(key, value)
        null -> resultMap.putNull(key)
      }
    }
  }

  return ReactStylesDiffMap(resultMap)
}
