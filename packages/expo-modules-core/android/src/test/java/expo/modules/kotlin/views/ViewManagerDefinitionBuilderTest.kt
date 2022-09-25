package expo.modules.kotlin.views

import android.view.View
import android.widget.ListView
import com.facebook.react.bridge.JavaOnlyMap
import com.google.common.truth.Truth
import expo.modules.core.ViewManager
import io.mockk.mockk
import org.junit.Assert
import org.junit.Test

class ViewManagerDefinitionBuilderTest {
  @Test
  fun `builder should fail without view factory`() {
    val builder = ViewManagerDefinitionBuilder()
      .apply {
        Prop("only-prop") { _: View, _: Int -> }
      }

    try {
      builder.build()
      Assert.fail("Builder should fail without view factory.")
    } catch (e: Exception) {
    }
  }

  @Test
  fun `builder should create correct definition`() {
    var p1Calls = 0
    var p2Calls = 0
    var viewFactoryCalls = 0

    val definition = ViewManagerDefinitionBuilder()
      .apply {
        View {
          viewFactoryCalls++
          mockk<ListView>()
        }

        Prop<ListView, Int>("p1") { _, _ -> p1Calls++ }
        Prop<ListView, Int>("p2") { _, _ -> p2Calls++ }
      }
      .build()

    definition.createView(mockk(), mockk())
    definition.setProps(
      JavaOnlyMap().apply {
        putInt("p1", 1)
        putInt("p2", 2)
      },
      mockk<ListView>(),
    )

    Truth.assertThat(definition.getViewManagerType()).isEqualTo(ViewManager.ViewManagerType.GROUP)
    Truth.assertThat(p1Calls).isEqualTo(1)
    Truth.assertThat(p2Calls).isEqualTo(1)
    Truth.assertThat(viewFactoryCalls).isEqualTo(1)
  }
}
