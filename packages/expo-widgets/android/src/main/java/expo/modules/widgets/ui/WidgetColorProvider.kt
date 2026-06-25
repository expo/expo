package expo.modules.widgets.ui

import android.annotation.SuppressLint
import androidx.compose.ui.graphics.Color
import androidx.glance.unit.ColorProvider

// TODO(@jakex7): Inspect restricted API use
@SuppressLint("RestrictedApi")
internal fun Color.toGlanceColorProvider(): ColorProvider {
  return ColorProvider(this)
}
