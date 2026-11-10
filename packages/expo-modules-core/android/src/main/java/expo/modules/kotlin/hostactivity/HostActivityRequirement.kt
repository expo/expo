package expo.modules.kotlin.hostactivity

import android.app.Activity

/**
 * The host Activity class a module declared with `RequiresHostActivity`.
 *
 * [feature] names the part of the module that needs it, such as "authentication prompts",
 * when the rest of the module works on any host. It is null when the whole module needs it.
 */
class HostActivityRequirement(
  val activityClass: Class<out Activity>,
  val feature: String? = null
)
