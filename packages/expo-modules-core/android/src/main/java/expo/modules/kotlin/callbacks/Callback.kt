package expo.modules.kotlin.callbacks

fun interface Callback<T> {
  operator fun invoke(arg: T)
}
