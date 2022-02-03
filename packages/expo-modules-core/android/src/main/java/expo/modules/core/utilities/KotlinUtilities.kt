package expo.modules.core.utilities

/**
 * Returns receiver, or block result if the receiver is `null`
 *
 * A more semantic equivalent to: `nullable ?: run { ... }`:
 * ```
 * val nonNullable1 = sthNullable.ifNull { ... }
 * val nonNullable2 = sthNullable ?: run { ... }
 * ```
 */
inline fun <T> T?.ifNull(block: () -> T): T = this ?: block()

/**
 * If the receiver is instance of `T`, returns the receiver, otherwise returns `null`
 *
 * Works the same as the `as?` operator, but allows method chaining without parentheses:
 * ```
 *   val x = a.b.takeIfInstanceOf<Number>?.someMethod()
 *   val y = (a.b as? Number)?.someMethod() // same, but needs parenthesis
 * ```
 */
inline fun <reified T> Any?.takeIfInstanceOf(): T? = if (this is T) this else null
