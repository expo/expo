package expo.modules.medialibrary

// This will be moved to MediaLibraryUtils when it is kotlinized

/**
 * Returns block result if the receiver is null
 */
inline fun <T> T?.ifNull(block: () -> T): T {
  if (this == null) {
    return block()
  }
  return this
}
