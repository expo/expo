package expo.modules.kotlin

/**
 * Simple iterator that will merge two other iterators.
 */
class ConcatIterator<T>(
  private val first: Iterator<T>,
  private val second: Iterator<T>
) : Iterator<T> {
  override fun hasNext(): Boolean = first.hasNext() || second.hasNext()

  override fun next(): T =
    if (first.hasNext()) {
      first.next()
    } else {
      second.next()
    }
}
