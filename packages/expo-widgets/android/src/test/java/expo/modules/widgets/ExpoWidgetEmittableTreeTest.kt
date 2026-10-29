@file:SuppressLint("RestrictedApi")

package expo.modules.widgets

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.glance.layout.EmittableColumn
import androidx.glance.text.EmittableText
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.JavaOnlyMap
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class ExpoWidgetEmittableTreeTest {
  @Test
  fun `text preserves system font families`() {
    for ((family, expected) in mapOf(
      null to null,
      "default" to null,
      "sansSerif" to "sans-serif",
      "serif" to "serif",
      "monospace" to "monospace",
      "cursive" to "cursive",
      "sans-serif-condensed" to "sans-serif-condensed"
    )) {
      assertEquals(family, expected, text(family).style?.fontFamily?.family)
    }
  }

  private fun text(fontFamily: String?): EmittableText {
    val props = JavaOnlyMap.of("text", "Font family")
    if (fontFamily != null) props.putString("fontFamily", fontFamily)
    val node = JavaOnlyMap.of("type", "TextView", "props", props)
    val context = ApplicationProvider.getApplicationContext<Context>()
    val root = node.toPeekRoot(
      context,
      InteractionSource.Widget("FontFamilyWidget"),
      DpSize(250.dp, 150.dp)
    ) as EmittableColumn
    return root.children.single() as EmittableText
  }
}
