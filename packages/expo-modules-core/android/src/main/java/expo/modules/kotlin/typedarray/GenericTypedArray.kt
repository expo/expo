package expo.modules.kotlin.typedarray

interface GenericTypedArray<T> : AnyTypedArray, Iterable<T> {
  operator fun get(index: Int): T
  operator fun set(index: Int, value: T)

  override fun iterator(): Iterator<T> = TypedArrayIterator(this)
}
