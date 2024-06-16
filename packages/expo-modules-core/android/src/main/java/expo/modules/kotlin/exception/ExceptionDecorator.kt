package expo.modules.kotlin.exception

@Throws(CodedException::class)
internal inline fun <T> exceptionDecorator(decoratorBlock: (e: CodedException) -> Throwable, block: () -> T): T {
  return try {
    block()
  } catch (e: Throwable) {
    throw decoratorBlock(e.toCodedException())
  }
}
