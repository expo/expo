package abi45_0_0.expo.modules.kotlin.callbacks

fun interface Callback<T> {
  operator fun invoke(arg: T)
}
