package expo.modules.kotlin.exception

import java.util.*
import kotlin.reflect.KType

/**
 * A class for errors specifying its `code` and providing the `description`.
 */
open class CodedException(
  message: String?,
  cause: Throwable?
) : Exception(message, cause) {
  // We need that secondary property, cause we can't access
  // the javaClass property in the constructor.
  private var providedCode: String? = null

  val code
    get() = providedCode ?: inferCode(javaClass)

  constructor(code: String, message: String, cause: Throwable?) : this(message, cause) {
    providedCode = code
  }

  constructor(message: String) : this(message, null)

  constructor(cause: Throwable) : this(cause.localizedMessage, cause)

  constructor() : this(null, null)

  companion object {
    /**
     * The code is inferred from the class name — e.g. the code of `ModuleNotFoundException` becomes `ERR_MODULE_NOT_FOUND`.
     */
    private fun inferCode(clazz: Class<*>): String {
      val name = requireNotNull(clazz.simpleName) { "Cannot infer code name from class name. We don't support anonymous classes." }

      return "ERR_" + name
        .replace("(Exception)$".toRegex(), "")
        .replace("(.)([A-Z])".toRegex(), "$1_$2")
        .toUpperCase(Locale.ROOT)
    }
  }
}

internal class IncompatibleArgTypeException(
  argumentType: KType,
  desiredType: KType,
  cause: Throwable? = null
) : CodedException(
  message = "Argument type $argumentType is not compatible with expected type $desiredType.",
  cause = cause
)

internal class MissingTypeConverter(
  forType: KType
) : CodedException(
  message = "Cannot find type converter for $forType.",
)

internal class InvalidArgsNumberException(received: Int, expected: Int) :
  CodedException(message = "Received $received arguments, but $expected was expected.")

internal class MethodNotFoundException(methodName: String, moduleName: String) :
  CodedException(message = "Cannot fund method $methodName in module $moduleName")

internal class NullArgumentException(desiredType: KType) :
  CodedException(message = "Cannot assigned null to not nullable type $desiredType")

internal class UnexpectedException(val throwable: Throwable) :
  CodedException(throwable)
