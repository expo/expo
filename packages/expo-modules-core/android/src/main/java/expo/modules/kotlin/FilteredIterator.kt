package expo.modules.kotlin

fun interface Filter<T> {
  fun apply(type: T): Boolean
}

class FilteredIterator<E>(
  private val iterator: Iterator<E>,
  private val filter: Filter<E>
) : Iterator<E> {
  private var next: E? = null

  init {
    this.findNext()
  }

  override fun hasNext(): Boolean {
    return next != null
  }

  override fun next(): E {
    val returnValue = next!!
    this.findNext()
    return returnValue
  }

  private fun findNext() {
    while (iterator.hasNext()) {
      val next = iterator.next()
      this.next = next
      if (filter.apply(next)) {
        return
      }
    }
    next = null
  }
}
