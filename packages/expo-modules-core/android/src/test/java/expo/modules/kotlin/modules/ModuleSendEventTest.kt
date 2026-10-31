package expo.modules.kotlin.modules

import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.KotlinInteropModuleRegistry
import expo.modules.kotlin.ModulesProvider
import io.mockk.every
import io.mockk.mockk
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.lang.ref.WeakReference

internal class EventEmittingModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EventEmittingModule")
    Events("onChange")
  }
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class ModuleSendEventTest {
  private val interopModuleRegistry = KotlinInteropModuleRegistry(
    object : ModulesProvider {
      override fun getModulesMap(): Map<Class<out Module>, String?> =
        mapOf(EventEmittingModule::class.java to null)
    },
    mockk(relaxed = true) {
      every { getModule(EventEmitter::class.java) } returns mockk(relaxed = true)
    },
    WeakReference(mockk(relaxed = true))
  )

  private val module = interopModuleRegistry.appContext.registry.getModule("EventEmittingModule")!!

  @Test
  fun `sendEvent should not throw after the app context is destroyed`() {
    interopModuleRegistry.onDestroy()

    module.sendEvent("onChange")
  }

  @Test
  fun `sendEvent should not throw after the app context is released`() {
    module.sendEvent("onChange")
    interopModuleRegistry.onDestroy()
    module._appContextHolder = WeakReference(null)

    module.sendEvent("onChange")
  }
}
