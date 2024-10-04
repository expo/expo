package abi46_0_0.expo.modules.kotlin.exception

internal inline fun <T> exceptionDecorator(decoratorBlock: (e: CodedException) -> Throwable, block: () -> T): T {
  return try {
    block()
  } catch (e: CodedException) {
    throw decoratorBlock(e)
  } catch (e: abi46_0_0.expo.modules.core.errors.CodedException) {
    throw decoratorBlock(CodedException(e.code, e.message, e.cause))
  } catch (e: Throwable) {
    throw decoratorBlock(UnexpectedException(e))
  }
}
