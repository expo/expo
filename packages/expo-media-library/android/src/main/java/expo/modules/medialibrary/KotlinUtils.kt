package expo.modules.medialibrary

// This will be moved to MediaLibraryUtils when it is kotlinized

/**
 * Returns receiver, or block result if the receiver is `null`
 */
inline fun <T> T?.ifNull(block: () -> T): T = this ?: block()

/**
 * If the receiver is instance of `T`, returns the receiver, otherwise returns `null`
 */
inline fun <reified T> Any?.takeIfInstanceOf(): T? = if (this is T) this else null
