package expo.modules.kotlin.records.formatters

fun interface ValueSelector<T> {
  operator fun invoke(value: T): Boolean
}

class OnNull<T> : ValueSelector<T?> where T : Any? {
  override fun invoke(value: T?): Boolean = value == null
}
