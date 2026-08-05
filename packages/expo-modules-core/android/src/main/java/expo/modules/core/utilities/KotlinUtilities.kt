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
