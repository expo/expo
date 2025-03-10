package expo.modules.video.utils

import java.lang.ref.WeakReference

internal class MutableWeakReference<T>(value: T? = null) {
  private var ref: WeakReference<T> = WeakReference(value)

  fun get(): T? {
    return ref.get()
  }

  fun set(value: T) {
    ref = WeakReference(value)
  }
}
