package expo.modules.kotlin

import com.google.common.truth.Truth
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.module
import io.mockk.mockk
import org.junit.Test
import java.lang.ref.WeakReference

class DummyModule_1 : Module() {
  override fun definition() = module {
    name("dummy-1")
    constants {
      mapOf(
        "c1" to 123,
        "c2" to "123"
      )
    }
  }
}

class DummyModule_2 : Module() {
  override fun definition() = module {
    name("dummy-2")
    viewManager {
      view { mockk() }
    }
  }
}

val provider = object : ModulesProvider {
  override fun getModulesList(): List<Class<out Module>> {
    return listOf(
      DummyModule_1::class.java,
      DummyModule_2::class.java
    )
  }
}

class KotlinInteropModuleRegistryTest {
  @Test
  fun `should register modules from provider`() {
    val interopModuleRegistry = KotlinInteropModuleRegistry(
      provider,
      mockk(),
      WeakReference(mockk(relaxed = true))
    )

    interopModuleRegistry.hasModule("dummy-1")
    interopModuleRegistry.hasModule("dummy-2")
  }

  @Test
  fun `should export constants`() {
    val interopModuleRegistry = KotlinInteropModuleRegistry(
      provider,
      mockk(),
      WeakReference(mockk(relaxed = true))
    )

    Truth.assertThat(interopModuleRegistry.exportedModulesConstants())
      .containsExactly(
        "dummy-1", mapOf("c1" to 123, "c2" to "123"),
        "dummy-2", emptyMap<String, Any>()
      )
  }

  @Test
  fun `should export view manages`() {
    val interopModuleRegistry = KotlinInteropModuleRegistry(
      provider,
      mockk(),
      WeakReference(mockk(relaxed = true))
    )

    val rnManagers = interopModuleRegistry.exportViewManagers()
    val expoManagersNames = interopModuleRegistry.exportedViewManagersNames()

    Truth.assertThat(rnManagers).hasSize(1)
    Truth.assertThat(rnManagers.first().name).isEqualTo("ViewManagerAdapter_dummy-2")
    Truth.assertThat(expoManagersNames).containsExactly("dummy-2")
  }
}
