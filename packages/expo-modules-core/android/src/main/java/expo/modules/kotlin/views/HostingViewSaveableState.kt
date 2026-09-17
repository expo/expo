package expo.modules.kotlin.views

import android.view.View
import java.util.concurrent.atomic.AtomicInteger

/**
 * Gives each Compose hosting view a unique `rememberSaveable` namespace.
 *
 * Previous solutions tried to give view an id but it caused some other issues
 * See https://github.com/expo/expo/issues/49964 and
 * https://github.com/expo/expo/issues/49964#issuecomment-5714493768.
 *
 * So using a tag instead of an id is a better solution.
 */
internal object HostingViewSaveableState {
  private val nextNamespace = AtomicInteger()

  fun assignNamespace(view: View, tagKey: Int) {
    view.setTag(tagKey, "Host:${nextNamespace.getAndIncrement()}")
  }
}
