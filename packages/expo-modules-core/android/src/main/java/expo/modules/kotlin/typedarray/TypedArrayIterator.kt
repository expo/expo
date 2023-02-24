package expo.modules.kotlin.typedarray

class TypedArrayIterator<T>(private val typedArray: GenericTypedArray<T>) : Iterator<T> {
  private var current = 0

  override fun hasNext(): Boolean = current < typedArray.length

  override fun next(): T = typedArray[current++]
}
