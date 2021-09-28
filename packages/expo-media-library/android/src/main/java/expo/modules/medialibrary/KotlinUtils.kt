package expo.modules.medialibrary

/**
 * Returns receiver, or block result if the receiver is `null`
 */
inline fun <T> T?.ifNull(block: () -> T): T = this ?: block()

/**
 * If the receiver is instance of `T`, returns the receiver, otherwise returns `null`
 *
 * Works the same as the `as?` operator, but allows method chaining without parentheses:
 * ```
 *   val x = a.b?.takeIfInstanceOf<Number>?.someMethod()
 *   val y = (a.b? as? Number)?.someMethod() // same, but needs parenthesis
 * ```
 */
inline fun <reified T> Any?.takeIfInstanceOf(): T? = if (this is T) this else null
