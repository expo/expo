package expo.modules.kotlin.views

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableMapKeySetIterator
import expo.modules.kotlin.Filter
import expo.modules.kotlin.FilteredIterator

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

class FilteredReadableMap(
  private val backingMap: ReadableMap,
  private val filteredKeys: List<String>
) : ReadableMap by backingMap {
  override val entryIterator =
    FilteredIterator(backingMap.entryIterator) {
      !filteredKeys.contains(it.key)
    }

  override fun keySetIterator(): ReadableMapKeySetIterator =
    FilteredReadableMapKeySetIterator(backingMap.keySetIterator()) {
      !filteredKeys.contains(it)
    }
}
