package expo.modules.kotlin.viewevent

import android.view.View
import com.google.common.truth.Truth
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.ModuleRegistry
import expo.modules.kotlin.views.ExpoView
import expo.modules.kotlin.views.ViewManagerDefinition
import io.mockk.every
import io.mockk.mockk
import org.junit.Test

class ViewEventTest {

  @Test
  fun `resolves a view definition from an ExpoView's stored reference`() {
    val definition = mockk<ViewManagerDefinition>()
    val view = mockk<ExpoView>()
    every { view.viewDefinition } returns definition

    val registry = mockk<ModuleRegistry>()

    Truth.assertThat(resolveViewDefinition(view, registry)).isSameInstanceAs(definition)
  }

  @Test
  fun `resolves a view definition by class for a non-ExpoView`() {
    // Plain View (like expo-gl's GLView) can't carry a definition, so it resolves by class.
    val view = mockk<View>()
    val holder = mockk<ModuleHolder<*>>()
    val definition = mockk<ViewManagerDefinition>()
    val registry = mockk<ModuleRegistry>()
    every { registry.getModuleHolder(view::class.java) } returns holder
    every { registry.getViewDefinition(holder, view::class.java) } returns definition

    Truth.assertThat(resolveViewDefinition(view, registry)).isSameInstanceAs(definition)
  }

  @Test
  fun `returns null when a non-ExpoView is not registered`() {
    val view = mockk<View>()
    val registry = mockk<ModuleRegistry>()
    every { registry.getModuleHolder(view::class.java) } returns null

    Truth.assertThat(resolveViewDefinition(view, registry)).isNull()
  }
}
