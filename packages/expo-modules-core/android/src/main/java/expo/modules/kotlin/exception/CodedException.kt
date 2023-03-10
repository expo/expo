package expo.modules.kotlin.exception

import com.facebook.react.bridge.ReadableType
import expo.modules.core.interfaces.DoNotStrip
import java.util.*
import kotlin.reflect.KClass
import kotlin.reflect.KProperty1
import kotlin.reflect.KType

/**
 * A class for errors specifying its `code` and providing the `description`.
 */
@DoNotStrip
open class CodedException(
  message: String?,
  cause: Throwable? = null
) : Exception(message, cause) {
  // We need that secondary property, cause we can't access
  // the javaClass property in the constructor.
  private var providedCode: String? = null

  val code
    get() = providedCode ?: inferCode(javaClass)

  constructor(code: String, message: String?, cause: Throwable?) : this(message = message, cause = cause) {
    providedCode = code
  }

  constructor(cause: Throwable) : this(message = cause.localizedMessage, cause = cause)

  constructor() : this(null, null)

  companion object {
    /**
     * The code is inferred from the class name — e.g. the code of `ModuleNotFoundException` becomes `ERR_MODULE_NOT_FOUND`.
     */
    @PublishedApi
    internal fun inferCode(clazz: Class<*>): String {
      val name = requireNotNull(clazz.simpleName) { "Cannot infer code name from class name. We don't support anonymous classes." }

      @Suppress("Deprecation")
      return "ERR_" + name
        .replace("(Exception)$".toRegex(), "")
        .replace("(.)([A-Z])".toRegex(), "$1_$2")
        .toUpperCase(Locale.ROOT)
    }
  }
}

/**
 * Infers error code from the exception class name -
 * e.g. the code of `ModuleNotFoundException` becomes `ERR_MODULE_NOT_FOUND`.
 *
 * Example:
 * ```kt
 * class NoPermissionException : CodedException()
 * val errorCode = errorCodeOf<NoPermissionException>() // ERR_NO_PERMISSION
 * ```
 *
 * **Note**: This works only if the exception class didn't overwrite the error code manually.
 */
inline fun <reified T : CodedException> errorCodeOf(): String =
  CodedException.inferCode(T::class.java)

internal class IncompatibleArgTypeException(
  argumentType: KType,
  desiredType: KType,
  cause: Throwable? = null
) : CodedException(
  message = "Argument type '$argumentType' is not compatible with expected type '$desiredType'.",
  cause = cause
)

internal class EnumNoSuchValueException(
  enumType: KClass<Enum<*>>,
  enumConstants: Array<out Enum<*>>,
  value: Any?
) : CodedException(
  message = "'$value' is not present in ${enumType.simpleName} enum, it must be one of: ${enumConstants.joinToString(separator = ", ") { "'${it.name}'" }}"
)

internal class MissingTypeConverter(
  forType: KType
) : CodedException(
  message = "Cannot find type converter for '$forType'.",
)

internal class InvalidArgsNumberException(received: Int, expected: Int, required: Int = expected) :
  CodedException(
    message = if (required < expected) {
      "Received $received arguments, but $expected was expected and at least $required is required"
    } else {
      "Received $received arguments, but $expected was expected"
    }
  )

internal class MethodNotFoundException :
  CodedException(message = "Method does not exist.")

internal class NullArgumentException :
  CodedException(message = "Cannot assigned null to not nullable type.")

internal class FieldRequiredException(property: KProperty1<*, *>) :
  CodedException(message = "Value for field '$property' is required, got nil")

@DoNotStrip
class UnexpectedException(
  message: String?,
  cause: Throwable? = null
) : CodedException(message = message, cause) {
  constructor(throwable: Throwable) : this(throwable.toString(), throwable)
  constructor(message: String) : this(message, null)
}

internal class ValidationException(message: String) :
  CodedException(message = message)

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

internal class PropSetException(
  propName: String,
  viewType: KClass<*>,
  cause: CodedException
) : DecoratedException(
  message = "Cannot set prop '$propName' on view '$viewType'",
  cause,
)

internal class ArgumentCastException(
  argDesiredType: KType,
  argIndex: Int,
  providedType: String,
  cause: CodedException,
) : DecoratedException(
  message = "The ${formatOrdinalNumber(argIndex + 1)} argument cannot be cast to type $argDesiredType (received $providedType)",
  cause,
) {
  companion object {
    fun formatOrdinalNumber(number: Int) = "$number" + when {
      (number % 100 in 11..13) -> "th"
      (number % 10) == 1 -> "st"
      (number % 10) == 2 -> "nd"
      (number % 10) == 3 -> "rd"
      else -> "th"
    }
  }
}

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

internal class CollectionElementCastException private constructor(
  collectionType: KType,
  elementType: KType,
  providedType: String,
  cause: CodedException
) : DecoratedException(
  message = "Cannot cast '$providedType' to '$elementType' required by the collection of type: '$collectionType'.",
  cause
) {
  constructor(
    collectionType: KType,
    elementType: KType,
    providedType: ReadableType,
    cause: CodedException
  ) : this(collectionType, elementType, providedType.name, cause)

  constructor(
    collectionType: KType,
    elementType: KType,
    providedType: KClass<*>,
    cause: CodedException
  ) : this(collectionType, elementType, providedType.toString(), cause)
}

@DoNotStrip
class JavaScriptEvaluateException(
  message: String,
  val jsStack: String
) : CodedException(
  message = """
  Cannot evaluate JavaScript code: $message
  $jsStack
  """.trimIndent()
)

@PublishedApi
internal class UnsupportedClass(
  clazz: KClass<*>,
) : CodedException(message = "Unsupported type: '$clazz'")
