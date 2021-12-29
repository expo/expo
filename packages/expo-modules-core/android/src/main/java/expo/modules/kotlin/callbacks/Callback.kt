package expo.modules.kotlin.callbacks

interface Callback<T> {
  fun invoke(arg: T)
}
