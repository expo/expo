package expo.modules.kotlin.allocators

fun interface ObjectConstructor<T> {
  fun construct(): T
}
