package expo.modules.kotlin.views

import android.content.Context
import android.widget.LinearLayout
import expo.modules.kotlin.AppContext

/**
 * A base class that should be used by every exported views.
 */
abstract class ExpoView(
  context: Context,
  val appContext: AppContext
) : LinearLayout(context)
