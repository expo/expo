package expo.modules.video.utils

import java.lang.ref.WeakReference

/**
 * A wrapper around a weak reference to an object.
 * Instead of comparing the WeakReferences directly, the wrapped objects are compared.
 */
class HashableWeakReference<T>(obj: T) {
  private val weakRef: WeakReference<T> = WeakReference(obj)

  fun get(): T? = weakRef.get()

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is HashableWeakReference<*>) return false

    val thisValue = weakRef.get()
    val otherValue = other.weakRef.get()

    return thisValue == otherValue
  }

  override fun hashCode(): Int {
    val value = weakRef.get()
    return value?.hashCode() ?: 0
  }
}
