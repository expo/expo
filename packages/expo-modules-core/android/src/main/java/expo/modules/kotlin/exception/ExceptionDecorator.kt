package expo.modules.kotlin.exception

import kotlinx.coroutines.CoroutineScope

@Throws(CodedException::class)
internal inline fun <T> exceptionDecorator(
  crossinline decoratorBlock: (e: CodedException) -> Throwable,
  crossinline block: () -> T
): T {
  return try {
    block()
  } catch (e: Throwable) {
    throw decoratorBlock(e.toCodedException())
  }
}

@Throws(CodedException::class)
internal suspend inline fun <T> CoroutineScope.exceptionDecorator(
  crossinline decoratorBlock: (e: CodedException) -> Throwable,
  crossinline block: suspend CoroutineScope.() -> T
): T {
  return try {
    block()
  } catch (e: Throwable) {
    throw decoratorBlock(e.toCodedException())
  }
}
