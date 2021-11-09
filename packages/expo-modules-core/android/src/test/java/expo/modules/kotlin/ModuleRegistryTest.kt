package expo.modules.kotlin

import com.google.common.truth.Truth
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.module
import io.mockk.mockk
import org.junit.Assert
import org.junit.Test
import java.lang.ref.WeakReference

class M1 : Module() {
  override fun definition() = module {
    name("m1")
  }
}

class M2 : Module() {
  override fun definition() = module {
    name("m2")
  }
}

class ModuleRegistryTest {

  @Test
  fun `should register all classes from provider`() {
    val provider = object : ModulesProvider {
      override fun getModulesList(): List<Class<out Module>> {
        return listOf(M1::class.java, M2::class.java)
      }
    }
    val moduleRegistry = ModuleRegistry(WeakReference(mockk()))

    moduleRegistry.register(provider)

    Truth.assertThat(moduleRegistry.toList()).hasSize(2)

    Truth.assertThat(moduleRegistry.hasModule("m1")).isTrue()
    Truth.assertThat(moduleRegistry.hasModule("m2")).isTrue()

    Truth.assertThat(moduleRegistry.getModule("m1")).isInstanceOf(M1::class.java)
    Truth.assertThat(moduleRegistry.getModule("m2")).isInstanceOf(M2::class.java)
  }

  @Test
  fun `should throw on incorrect definition`() {
    class IncorrectModule : Module() {
      override fun definition() = module { }
    }

    val provider = object : ModulesProvider {
      override fun getModulesList(): List<Class<out Module>> {
        return listOf(IncorrectModule::class.java)
      }
    }
    val moduleRegistry = ModuleRegistry(mockk())

    try {
      moduleRegistry.register(provider)
      Assert.fail("Module registry should throw.")
    } catch (e: Exception) {
    }
  }
}
