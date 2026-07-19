package expo.modules.devlauncher.compose.utils

data class ValueWithIsLast<T>(
  val value: T,
  val isLast: Boolean
)

class DecoratedIterator<T, U>(
  iterable: Iterable<T>,
  private val dataDecorator: (T) -> U
) : Iterator<U> {
  private val iterator = iterable.iterator()
  override fun hasNext(): Boolean = iterator.hasNext()
  override fun next(): U = dataDecorator(iterator.next())
}

class DecoratedIterable<T, U>(
  private val iterable: Iterable<T>,
  private val dataDecorator: (T) -> U
) : Iterable<U> {
  override fun iterator(): Iterator<U> = DecoratedIterator(iterable, dataDecorator)
}

fun <T> Collection<T>.withIsLast(): Iterable<ValueWithIsLast<T>> {
  val lastIndex = size - 1
  return DecoratedIterable<IndexedValue<T>, ValueWithIsLast<T>>(withIndex()) { it ->
    ValueWithIsLast(
      value = it.value,
      isLast = it.index == lastIndex
    )
  }
}
