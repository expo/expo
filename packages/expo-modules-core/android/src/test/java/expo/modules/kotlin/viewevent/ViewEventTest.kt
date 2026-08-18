package expo.modules.kotlin.viewevent

import android.view.View
import com.google.common.truth.Truth
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.ModuleRegistry
import expo.modules.kotlin.views.CallbacksDefinition
import expo.modules.kotlin.views.ViewFunctionHolder
import expo.modules.kotlin.views.ViewManagerDefinition
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test

class ViewEventTest {

  @Test
  fun `reads callbacks straight from a ViewFunctionHolder without touching the registry`() {
    val callbacks = CallbacksDefinition(arrayOf("onValueChange"))
    val view = mockk<View>(moreInterfaces = arrayOf(ViewFunctionHolder::class))
    every { (view as ViewFunctionHolder).callbacksDefinition } returns callbacks

    val registry = mockk<ModuleRegistry>()

    Truth.assertThat(resolveCallbacksDefinition(view, registry)).isSameInstanceAs(callbacks)
    verify(exactly = 0) { registry.getModuleHolder(any<Class<View>>()) }
  }

  @Test
  fun `resolves callbacks by class for a non-ViewFunctionHolder view`() {
    val view = mockk<View>()
    val holder = mockk<ModuleHolder<*>>()
    val callbacks = CallbacksDefinition(arrayOf("onValueChange"))
    val definition = mockk<ViewManagerDefinition> {
      every { callbacksDefinition } returns callbacks
    }
    val registry = mockk<ModuleRegistry>()
    every { registry.getModuleHolder(view::class.java) } returns holder
    every { registry.getViewDefinition(holder, view::class.java) } returns definition

    Truth.assertThat(resolveCallbacksDefinition(view, registry)).isSameInstanceAs(callbacks)
  }
}
