package expo.modules.kotlin.exception

import java.util.*

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
