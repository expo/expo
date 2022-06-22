package expo.modules.kotlin.activityresult

import android.os.Bundle

interface Bundleable<T> {
  /**
   * Flatten this object in to a Bundle.
   */
  fun toBundle(): Bundle

  /**
   * Apply the data from a Bundle whose data had previously been written by
   * [Bundleable.toBundle()][Bundleable.toBundle].
   *
   * @param source The Bundle to read the object's data from.
   * @return Returns a new instance of the Bundleable class.
   */
  fun applyBundle(source: Bundle): T
}
