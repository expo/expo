package expo.modules.kotlin.exception

import com.facebook.react.bridge.ReadableType
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

  constructor(code: String, message: String?, cause: Throwable?) : this(message, cause) {
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
  message = "Argument type '$argumentType' is not compatible with expected type '$desiredType'.",
  cause = cause
)

internal class MissingTypeConverter(
  forType: KType
) : CodedException(
  message = "Cannot find type converter for '$forType'.",
)

internal class InvalidArgsNumberException(received: Int, expected: Int) :
  CodedException(message = "Received $received arguments, but $expected was expected.")

internal class MethodNotFoundException :
  CodedException(message = "Method does not exist.")

internal class NullArgumentException :
  CodedException(message = "Cannot assigned null to not nullable type.")

internal class UnexpectedException(val throwable: Throwable) :
  CodedException(message = throwable.toString(), throwable)

/**
 * A base class for all exceptions used in `exceptionDecorator` function.
 */
internal open class DecoratedException(
  message: String,
  cause: CodedException,
) : CodedException(
  cause.code,
  message = "$message${System.lineSeparator()}→ Caused by: ${cause.localizedMessage ?: cause}",
  cause
)

internal class FunctionCallException(
  methodName: String,
  moduleName: String,
  cause: CodedException
) : DecoratedException(
  message = "Call to function '$moduleName.$methodName' has been rejected.",
  cause,
)

internal class ArgumentCastException(
  argDesiredType: KType,
  argIndex: Int,
  providedType: ReadableType,
  cause: CodedException,
) : DecoratedException(
  message = "Argument at index '$argIndex' couldn't be casted to type '$argDesiredType' (received '$providedType').",
  cause,
)

internal class FieldCastException(
  fieldName: String,
  fieldType: KType,
  providedType: ReadableType,
  cause: CodedException
) : DecoratedException(
  message = "Cannot cast '${providedType.name}' for field '$fieldName' ('$fieldType').",
  cause
)

internal class RecordCastException(
  recordType: KType,
  cause: CodedException
) : DecoratedException(
  message = "Cannot create a record of the type: '$recordType'.",
  cause
)

internal class CollectionElementCastException(
  collectionType: KType,
  elementType: KType,
  providedType: ReadableType,
  cause: CodedException
) : DecoratedException(
  message = "Cannot cast '${providedType.name}' to '$elementType' required by the collection of type: '$collectionType'.",
  cause
)
