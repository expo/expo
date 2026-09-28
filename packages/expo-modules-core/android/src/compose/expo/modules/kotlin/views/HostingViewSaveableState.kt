package expo.modules.kotlin.views

import android.view.View
import androidx.compose.ui.R as ComposeUiR
import java.util.concurrent.atomic.AtomicInteger

/**
 * Gives each Compose hosting view a unique `rememberSaveable` namespace.
 *
 * Previous solutions tried to give view an id but it caused some other issues
 * See https://github.com/expo/expo/issues/49964 and
 * https://github.com/expo/expo/issues/49964#issuecomment-5714493768.
 *
 * So using a tag instead of an id is a better solution.
 * Compose reads this tag before falling back to `View.id`, so we don't call `generateViewId()`.
 */
internal object HostingViewSaveableState {
  private val nextNamespace = AtomicInteger()

  fun assignNamespace(view: View) {
    view.setTag(ComposeUiR.id.compose_view_saveable_id_tag, "Host:${nextNamespace.getAndIncrement()}")
  }
}
